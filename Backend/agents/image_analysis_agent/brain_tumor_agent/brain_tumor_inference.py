import os
import logging
from typing import Dict, Optional

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from torchvision.models import efficientnet_b3


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class BrainTumorClassifier:
    """EfficientNet-B3 based 4-class MRI brain tumor classifier."""

    CLASS_NAMES = ["glioma", "meningioma", "notumor", "pituitary"]

    REASONS = {
        "glioma": "Glioma detected — irregular abnormal tissue growth patterns observed inside the brain.",
        "meningioma": "Meningioma detected — well-defined abnormal mass observed near the outer brain membrane.",
        "pituitary": "Pituitary tumor detected — abnormal tissue growth observed near the pituitary gland.",
        "notumor": "No tumor detected — the MRI appears structurally normal with no visible abnormal masses.",
    }

    def __init__(
        self,
        model_path: str = "agents/image_analysis_agent/brain_tumor_agent/models/model.pth",
        device: Optional[torch.device] = None,
    ):
        self.model_path = model_path
        self.device = device if device else torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

        self.transform = transforms.Compose([
            transforms.Resize((300, 300)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

        self.model = self._load_model()

    def _build_model(self):
        model = efficientnet_b3(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier[1] = nn.Linear(in_features, 4)
        return model

    def _load_model(self):
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found: {self.model_path}")

            model = self._build_model()
            state_dict = torch.load(self.model_path, map_location=self.device, weights_only=False)

            if isinstance(state_dict, dict):
                for k in ("state_dict", "model", "model_state_dict"):
                    if k in state_dict and isinstance(state_dict[k], dict):
                        state_dict = state_dict[k]
                        break

            model.load_state_dict(state_dict)
            model.to(self.device)
            model.eval()
            logger.info(f"Loaded brain tumor classifier from {self.model_path}")
            return model
        except Exception as exc:
            logger.error(f"Failed to load brain tumor classifier: {exc}")
            return None

    def predict(self, image_path: str) -> Dict[str, Optional[str]]:
        if self.model is None:
            return {"success": False, "error": "Brain tumor classifier model could not be loaded."}

        try:
            image = Image.open(image_path).convert("RGB")
            img = self.transform(image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                outputs = self.model(img)
                probs = torch.softmax(outputs, dim=1)
                confidence, predicted = torch.max(probs, 1)

            predicted_idx = int(predicted.item())
            predicted_label = self.CLASS_NAMES[predicted_idx]
            predicted_confidence = float(confidence.item())
            reason = self.REASONS.get(predicted_label, "")

            logger.info(f"Prediction: {predicted_label} | Confidence: {predicted_confidence:.2%}")

            return {
                "success": True,
                "prediction": predicted_label,
                "confidence": predicted_confidence,
                "diagnosis": predicted_label.upper(),
                "category": "Brain Tumor Detection",
                "description": reason,
                "confidence_text": f"{predicted_confidence * 100:.2f}%",
                "error": None,
            }
        except Exception as exc:
            logger.error(f"Brain tumor classification failed: {exc}")
            return {"success": False, "error": str(exc)}
