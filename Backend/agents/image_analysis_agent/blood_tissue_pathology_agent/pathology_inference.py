"""
Blood and Tissue Pathology Classification Agent

Classes:
0 -> chronic_myeloid_leukemia
1 -> iron_deficiency_anemia
2 -> lung_pathology
3 -> thalassemia
"""

import os
import logging
from typing import Dict, Optional, List

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms, models


# =========================
# LOGGING
# =========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


class BloodTissuePathologyClassifier:
    """
    ResNet18-based 4-class pathology classifier
    """

    # ==========================================
    # IMPORTANT:
    # MUST MATCH TRAINING ORDER EXACTLY
    # ==========================================
    CLASS_NAMES = [
        "chronic_myeloid_leukemia",
        "iron_deficiency_anemia",
        "lung_pathology",
        "thalassemia"
    ]

    CLASS_DESCRIPTIONS = {
        "chronic_myeloid_leukemia":
            "Chronic Myeloid Leukemia (CML) - A type of blood cancer",

        "iron_deficiency_anemia":
            "Iron Deficiency Anemia - A condition caused by low iron levels",

        "lung_pathology":
            "Lung Pathology - Abnormal disease condition in lungs",

        "thalassemia":
            "Thalassemia - Genetic blood disorder affecting hemoglobin"
    }

    DISEASE_CATEGORIES = {
        "chronic_myeloid_leukemia": "Blood Disease",
        "iron_deficiency_anemia": "Blood Disease",
        "lung_pathology": "Tissue Pathology",
        "thalassemia": "Blood Disease"
    }

    def __init__(
        self,
        model_path: str,
        device: Optional[torch.device] = None
    ):

        self.model_path = model_path

        self.device = (
            device
            if device
            else torch.device("cuda" if torch.cuda.is_available() else "cpu")
        )

        logger.info(f"Using device: {self.device}")

        # ==========================================
        # IMAGE TRANSFORMS
        # MUST MATCH TRAINING
        # ==========================================
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                [0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225]
            )
        ])

        # Load model
        self.model = self._load_model()

    # ==========================================
    # BUILD MODEL
    # ==========================================
    def _build_model(self):

        model = models.resnet18(weights=None)

        model.fc = nn.Linear(
            model.fc.in_features,
            len(self.CLASS_NAMES)
        )

        return model

    # ==========================================
    # LOAD MODEL
    # ==========================================
    def _load_model(self):

        try:

            if not os.path.exists(self.model_path):

                logger.error(
                    f"❌ Model file not found: {self.model_path}"
                )

                return None

            model = self._build_model()

            checkpoint = torch.load(
                self.model_path,
                map_location=self.device
            )

            # Handle checkpoint/state_dict
            if isinstance(checkpoint, dict) and "state_dict" in checkpoint:
                state_dict = checkpoint["state_dict"]
            else:
                state_dict = checkpoint

            model.load_state_dict(state_dict)

            model.to(self.device)

            model.eval()

            logger.info("✅ Model loaded successfully")

            return model

        except Exception as e:

            logger.error(f"❌ Error loading model: {e}")

            return None

    # ==========================================
    # SINGLE IMAGE PREDICTION
    # ==========================================
    def predict(self, image_path: str) -> Dict:

        try:

            if self.model is None:

                return {
                    "success": False,
                    "error": "Model not loaded",
                    "prediction": None,
                    "confidence": None,
                    "category": None,
                    "description": None
                }

            if not os.path.exists(image_path):

                return {
                    "success": False,
                    "error": f"Image not found: {image_path}",
                    "prediction": None,
                    "confidence": None,
                    "category": None,
                    "description": None
                }

            # ==========================================
            # LOAD IMAGE
            # ==========================================
            image = Image.open(image_path).convert("RGB")

            image_tensor = self.transform(image)

            image_tensor = image_tensor.unsqueeze(0)

            image_tensor = image_tensor.to(self.device)

            # ==========================================
            # PREDICTION
            # ==========================================
            with torch.no_grad():

                outputs = self.model(image_tensor)

                probabilities = torch.softmax(outputs, dim=1)

                confidence, predicted = torch.max(probabilities, 1)

            predicted_index = predicted.item()

            predicted_label = self.CLASS_NAMES[predicted_index]

            confidence_score = float(confidence.item())

            category = self.DISEASE_CATEGORIES[predicted_label]

            description = self.CLASS_DESCRIPTIONS[predicted_label]

            probs_vec = probabilities.squeeze(0).cpu().tolist()
            class_probabilities = {
                self.CLASS_NAMES[i]: float(probs_vec[i]) for i in range(len(self.CLASS_NAMES))
            }

            logger.info(
                f"Prediction: {predicted_label} | "
                f"Confidence: {confidence_score:.4f}"
            )

            return {
                "success": True,
                "prediction": predicted_label,
                "confidence": round(confidence_score, 4),
                "category": category,
                "description": description,
                "class_probabilities": class_probabilities,
                "error": None
            }

        except Exception as e:

            logger.error(f"❌ Prediction error: {e}")

            return {
                "success": False,
                "error": str(e),
                "prediction": None,
                "confidence": None,
                "category": None,
                "description": None
            }

    # ==========================================
    # BATCH PREDICTION
    # ==========================================
    def predict_batch(self, image_paths: List[str]):

        results = []

        for path in image_paths:

            result = self.predict(path)

            results.append(result)

        return results