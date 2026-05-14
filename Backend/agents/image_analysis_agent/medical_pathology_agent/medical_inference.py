import logging
import os
from typing import Dict, Optional

import torch
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms
import torch.nn as nn

from .model_download import load_hf_checkpoint


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class MedicalPathologyClassifier:
    """4-class medical pathology image classifier with local-model primary, HF fallback."""

    CLASS_NAMES = [
        "iron_deficiency_anemia",
        "thalassemia",
        "chronic_myeloid_leukemia",
        "lung_pathology",
    ]

    def __init__(
        self,
        model_path: str,
        hf_model_id: str = "google/vit-base-patch16-224",
        confidence_threshold: float = 0.60,
        device: Optional[torch.device] = None,
    ):
        self.model_path = model_path
        self.hf_model_id = hf_model_id
        self.confidence_threshold = confidence_threshold
        self.device = device if device else torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

        self.transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ]
        )

        self.processor = None
        self.hf_model = None
        self.local_model = None
        self.backend = "none"
        self._load_model()

    def _build_local_model(self) -> nn.Module:
        model = models.resnet50(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Linear(in_features, len(self.CLASS_NAMES))
        return model

    def _load_local_model(self) -> bool:
        if not os.path.exists(self.model_path):
            logger.warning("Local medical model not found at %s", self.model_path)
            return False

        try:
            checkpoint = torch.load(self.model_path, map_location=self.device)
            state_dict = checkpoint["state_dict"] if isinstance(checkpoint, dict) and "state_dict" in checkpoint else checkpoint

            model = self._build_local_model()
            model.load_state_dict(state_dict)
            model.to(self.device)
            model.eval()
            self.local_model = model
            self.backend = "local"
            logger.info("Using local medical pathology model from %s", self.model_path)
            return True
        except Exception as exc:
            logger.error("Failed to load local medical model: %s", exc)
            return False

    def _load_model(self) -> None:
        if self._load_local_model():
            return

        processor, hf_model, is_compatible = load_hf_checkpoint(
            model_id=self.hf_model_id,
            target_labels=self.CLASS_NAMES,
            device=self.device,
        )
        if is_compatible:
            self.processor = processor
            self.hf_model = hf_model
            self.backend = "huggingface"
            logger.info("Using Hugging Face medical pathology model: %s", self.hf_model_id)
            return

        logger.warning(
            "No usable local model and no compatible Hugging Face model available. "
            "Predictions will return an error until a compatible model is provided."
        )

    def _predict_hf(self, image: Image.Image) -> Dict[str, object]:
        inputs = self.processor(images=image, return_tensors="pt")
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            logits = self.hf_model(**inputs).logits
            probs = torch.softmax(logits, dim=1)
            confidence, predicted = torch.max(probs, dim=1)

        predicted_idx = int(predicted.item())
        predicted_label = self.hf_model.config.id2label.get(predicted_idx, "unknown")
        predicted_label = predicted_label.strip().lower().replace(" ", "_").replace("-", "_")

        conf = float(confidence.item())
        final_label = predicted_label if conf >= self.confidence_threshold else "uncertain"
        logger.info(
            "Hugging Face prediction -> class=%s confidence=%.4f",
            final_label,
            conf,
        )
        return {"prediction": final_label, "confidence": conf, "model_used": "huggingface"}

    def _predict_local(self, image: Image.Image) -> Dict[str, object]:
        tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.local_model(tensor)
            probs = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probs, dim=1)

        predicted_idx = int(predicted.item())
        predicted_label = self.CLASS_NAMES[predicted_idx]
        conf = float(confidence.item())
        final_label = predicted_label if conf >= self.confidence_threshold else "uncertain"
        logger.info(
            "Local prediction -> class=%s confidence=%.4f",
            final_label,
            conf,
        )
        return {"prediction": final_label, "confidence": conf, "model_used": "local"}

    def _load_image(self, image_path: str) -> Image.Image:
        """Load and verify an image file before inference."""
        try:
            with Image.open(image_path) as image:
                image.verify()
            with Image.open(image_path) as image:
                return image.convert("RGB")
        except FileNotFoundError:
            raise FileNotFoundError("Image file not found.")
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise ValueError("Invalid or corrupted image file.") from exc

    def predict_image(self, image_path: str) -> Dict[str, object]:
        """
        Input: image path
        Output: {"prediction": "thalassemia", "confidence": 0.87, "model_used": "local"}
        """
        try:
            if not os.path.exists(image_path):
                return {"prediction": "error", "confidence": 0.0, "error": "Image file not found."}

            image = self._load_image(image_path)

            if self.backend == "huggingface" and self.hf_model is not None and self.processor is not None:
                result = self._predict_hf(image)
            elif self.backend == "local" and self.local_model is not None:
                result = self._predict_local(image)
            else:
                return {
                    "prediction": "error",
                    "confidence": 0.0,
                    "error": "Medical pathology model is not loaded.",
                }

            logger.info(
                "Medical pathology prediction complete -> model_used=%s prediction=%s confidence=%.4f",
                result.get("model_used", self.backend),
                result.get("prediction"),
                float(result.get("confidence", 0.0)),
            )
            return result
        except ValueError as exc:
            logger.error("Medical pathology prediction failed: %s", exc)
            return {"prediction": "error", "confidence": 0.0, "error": str(exc)}
        except Exception as exc:
            logger.error("Medical pathology prediction failed: %s", exc)
            return {"prediction": "error", "confidence": 0.0, "error": str(exc)}


_default_classifier: Optional[MedicalPathologyClassifier] = None


def _get_default_classifier() -> MedicalPathologyClassifier:
    global _default_classifier
    if _default_classifier is None:
        model_path = "./agents/image_analysis_agent/medical_pathology_agent/models/medical_model.pth"
        hf_model_id = os.getenv("HF_MEDICAL_PATHOLOGY_MODEL_ID", "google/vit-base-patch16-224")
        threshold = float(os.getenv("MEDICAL_PATHOLOGY_CONFIDENCE_THRESHOLD", "0.6"))
        _default_classifier = MedicalPathologyClassifier(
            model_path=model_path,
            hf_model_id=hf_model_id,
            confidence_threshold=threshold,
        )
    return _default_classifier


def predict_image(image_path: str):
    """
    Input: image path
    Output:
    {
        "prediction": "thalassemia",
        "confidence": 0.87
    }
    """
    return _get_default_classifier().predict_image(image_path)
