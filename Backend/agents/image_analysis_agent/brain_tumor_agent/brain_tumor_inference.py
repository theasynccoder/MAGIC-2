import os
import logging
from typing import Dict, Optional

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from torchvision.models import vgg16
from huggingface_hub import hf_hub_download


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


class BrainTumorClassifier:
    """VGG16-based 4-class MRI brain tumor classifier."""

    CLASS_NAMES = ["pituitary", "glioma", "no_tumor", "meningioma"]

    def __init__(
        self,
        model_path: str,
        repo_id: str = "mtalhazafar/brain-tumor-detection-model",
        filename: str = "model.pth",
        device: Optional[torch.device] = None,
    ):
        self.model_path = model_path
        self.repo_id = repo_id
        self.filename = filename
        self.device = device if device else torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.transform = transforms.Compose(
            [
                transforms.Resize((128, 128)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ]
        )
        self.model = self._load_model()

    def _resolve_model_path(self) -> str:
        if os.path.exists(self.model_path):
            return self.model_path

        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        try:
            downloaded = hf_hub_download(
                repo_id=self.repo_id,
                filename=self.filename,
                local_dir=os.path.dirname(self.model_path),
                local_dir_use_symlinks=False,
            )
            logger.info(f"Downloaded brain tumor model weights from Hugging Face: {downloaded}")
            return downloaded
        except TypeError:
            downloaded = hf_hub_download(
                repo_id=self.repo_id,
                filename=self.filename,
                local_dir=os.path.dirname(self.model_path),
            )
            logger.info(f"Downloaded brain tumor model weights from Hugging Face: {downloaded}")
            return downloaded

    def _build_model(self):
        model = vgg16(weights=None)
        model.classifier[6] = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(4096, 4)
        )
        return model

    def _load_model(self):
        try:
            model_weights_path = self._resolve_model_path()
            model = self._build_model()
            state_dict = torch.load(model_weights_path, map_location=self.device)
            model.load_state_dict(state_dict)
            model.to(self.device)
            model.eval()
            logger.info(f"Loaded brain tumor classifier from {model_weights_path}")
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

            return {
                "success": True,
                "prediction": predicted_label,
                "confidence": predicted_confidence,
                "error": None,
            }
        except Exception as exc:
            logger.error(f"Brain tumor classification failed: {exc}")
            return {"success": False, "error": str(exc)}
