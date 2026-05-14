# import os
# import logging
# from typing import Dict, Optional

# import torch
# import torch.nn as nn
# from PIL import Image
# from torchvision import transforms
# from torchvision.models import vgg16
# from huggingface_hub import hf_hub_download


# logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
# logger = logging.getLogger(__name__)


# class BrainTumorClassifier:
#     """VGG16-based 4-class MRI brain tumor classifier."""

#     CLASS_NAMES = ["pituitary", "glioma", "no_tumor", "meningioma"]

#     def __init__(
#         self,
#         model_path: str,
#         repo_id: str = "mtalhazafar/brain-tumor-detection-model",
#         filename: str = "model.pth",
#         device: Optional[torch.device] = None,
#     ):
#         self.model_path = model_path
#         self.repo_id = repo_id
#         self.filename = filename
#         self.device = device if device else torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
#         self.transform = transforms.Compose(
#             [
#                 transforms.Resize((128, 128)),
#                 transforms.ToTensor(),
#                 transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
#             ]
#         )
#         self.model = self._load_model()

#     def _resolve_model_path(self) -> str:
#         if os.path.exists(self.model_path):
#             return self.model_path

#         os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
#         try:
#             downloaded = hf_hub_download(
#                 repo_id=self.repo_id,
#                 filename=self.filename,
#                 local_dir=os.path.dirname(self.model_path),
#                 local_dir_use_symlinks=False,
#             )
#             logger.info(f"Downloaded brain tumor model weights from Hugging Face: {downloaded}")
#             return downloaded
#         except TypeError:
#             downloaded = hf_hub_download(
#                 repo_id=self.repo_id,
#                 filename=self.filename,
#                 local_dir=os.path.dirname(self.model_path),
#             )
#             logger.info(f"Downloaded brain tumor model weights from Hugging Face: {downloaded}")
#             return downloaded

#     def _build_model(self):
#         model = vgg16(weights=None)
#         model.classifier[6] = nn.Sequential(
#             nn.Dropout(0.5),
#             nn.Linear(4096, 4)
#         )
#         return model

#     def _load_model(self):
#         try:
#             model_weights_path = self._resolve_model_path()
#             model = self._build_model()
#             state_dict = torch.load(model_weights_path, map_location=self.device)
#             model.load_state_dict(state_dict)
#             model.to(self.device)
#             model.eval()
#             logger.info(f"Loaded brain tumor classifier from {model_weights_path}")
#             return model
#         except Exception as exc:
#             logger.error(f"Failed to load brain tumor classifier: {exc}")
#             return None

#     def predict(self, image_path: str) -> Dict[str, Optional[str]]:
#         if self.model is None:
#             return {"success": False, "error": "Brain tumor classifier model could not be loaded."}

#         try:
#             image = Image.open(image_path).convert("RGB")
#             img = self.transform(image).unsqueeze(0).to(self.device)

#             with torch.no_grad():
#                 outputs = self.model(img)
#                 probs = torch.softmax(outputs, dim=1)
#                 confidence, predicted = torch.max(probs, 1)

#             predicted_idx = int(predicted.item())
#             predicted_label = self.CLASS_NAMES[predicted_idx]
#             predicted_confidence = float(confidence.item())

#             return {
#                 "success": True,
#                 "prediction": predicted_label,
#                 "confidence": predicted_confidence,
#                 "error": None,
#             }
#         except Exception as exc:
#             logger.error(f"Brain tumor classification failed: {exc}")
#             return {"success": False, "error": str(exc)}

# import os
# import logging
# from typing import Dict, Optional

# import torch
# import torch.nn as nn
# from PIL import Image
# from torchvision import transforms
# from torchvision.models import efficientnet_b3


# # ==========================================
# # LOGGING
# # ==========================================

# logging.basicConfig(
#     level=logging.INFO,
#     format="%(asctime)s - %(levelname)s - %(message)s"
# )

# logger = logging.getLogger(__name__)


# # ==========================================
# # BRAIN TUMOR CLASSIFIER
# # ==========================================

# class BrainTumorClassifier:

#     CLASS_NAMES = [
#         "glioma",
#         "meningioma",
#         "notumor",
#         "pituitary"
#     ]

#     # ==========================================
#     # INIT
#     # ==========================================

#     def __init__(
#         self,
#         model_path: str = "agents/image_analysis_agent/brain_tumor_agent/models/model.pth",
#         device: Optional[torch.device] = None,
#     ):

#         self.model_path = model_path

#         self.device = (
#             device
#             if device
#             else torch.device(
#                 "cuda" if torch.cuda.is_available() else "cpu"
#             )
#         )

#         print("\n========== MODEL DEBUG ==========")
#         print("Current Working Directory:", os.getcwd())
#         print("Model Path:", self.model_path)
#         print("File Exists:", os.path.exists(self.model_path))
#         print("=================================\n")

#         # ==========================================
#         # IMAGE TRANSFORM
#         # ==========================================

#         self.transform = transforms.Compose([

#             transforms.Resize((300, 300)),

#             transforms.ToTensor(),

#             transforms.Normalize(
#                 [0.485, 0.456, 0.406],
#                 [0.229, 0.224, 0.225]
#             ),
#         ])

#         # ==========================================
#         # LOAD MODEL
#         # ==========================================

#         self.model = self._load_model()

#     # ==========================================
#     # BUILD MODEL
#     # ==========================================

#     def _build_model(self):

#         model = efficientnet_b3(weights=None)

#         model.classifier[1] = nn.Linear(
#             model.classifier[1].in_features,
#             4
#         )

#         return model

#     # ==========================================
#     # LOAD MODEL
#     # ==========================================

#     def _load_model(self):

#         try:

#             # ==========================================
#             # CHECK FILE
#             # ==========================================

#             if not os.path.exists(self.model_path):

#                 raise FileNotFoundError(
#                     f"❌ Model file not found: {self.model_path}"
#                 )

#             # ==========================================
#             # BUILD MODEL
#             # ==========================================

#             model = self._build_model()

#             # ==========================================
#             # LOAD MODEL WEIGHTS
#             # ==========================================

#             print("\nLoading model weights...\n")

#             state_dict = torch.load(
#                 self.model_path,
#                 map_location=self.device
#             )

#             model.load_state_dict(state_dict)

#             model.to(self.device)

#             model.eval()

#             logger.info(
#                 f"✅ Brain tumor model loaded successfully from {self.model_path}"
#             )

#             return model

#         except Exception as exc:

#             print("\n========== REAL MODEL ERROR ==========")
#             print(exc)
#             print("======================================\n")

#             logger.error(
#                 f"❌ Failed to load model: {exc}"
#             )

#             return None

#     # ==========================================
#     # EXPLANATION TEXT
#     # ==========================================

#     def get_reason(self, predicted_class):

#         reasons = {

#             "glioma":
#             "Glioma detected because the MRI scan shows irregular abnormal tissue growth patterns inside the brain tissue region.",

#             "meningioma":
#             "Meningioma detected because the model identified a well-defined abnormal mass near the outer brain membrane region.",

#             "pituitary":
#             "Pituitary tumor detected due to abnormal tissue growth near the pituitary gland area.",

#             "notumor":
#             "No tumor detected because the MRI scan appears structurally normal without visible abnormal masses."
#         }

#         return reasons.get(
#             predicted_class,
#             "No explanation available."
#         )

#     # ==========================================
#     # PREDICT
#     # ==========================================

#     def predict(
#         self,
#         image_path: str
#     ) -> Dict[str, Optional[str]]:

#         if self.model is None:

#             return {
#                 "success": False,
#                 "error": "Brain tumor classifier model could not be loaded."
#             }

#         try:

#             # ==========================================
#             # LOAD IMAGE
#             # ==========================================

#             image = Image.open(image_path).convert("RGB")

#             img = self.transform(image).unsqueeze(0)

#             img = img.to(self.device)

#             # ==========================================
#             # MODEL PREDICTION
#             # ==========================================

#             with torch.no_grad():

#                 outputs = self.model(img)

#                 probs = torch.softmax(outputs, dim=1)

#                 confidence, predicted = torch.max(probs, 1)

#             # ==========================================
#             # RESULT EXTRACTION
#             # ==========================================

#             predicted_idx = int(predicted.item())

#             predicted_label = self.CLASS_NAMES[predicted_idx]

#             predicted_confidence = float(confidence.item()) * 100

#             reason = self.get_reason(predicted_label)

#             logger.info(
#                 f"✅ Prediction: {predicted_label} | Confidence: {predicted_confidence:.2f}%"
#             )

#             # ==========================================
#             # RETURN RESPONSE
#             # ==========================================

#             return {

#                 "success": True,

#                 # OLD BACKEND KEYS
#                 "prediction": predicted_label,

#                 "confidence": predicted_confidence,

#                 # NEW FRONTEND DISPLAY KEYS
#                 "diagnosis": predicted_label.upper(),

#                 "category": "Brain Tumor Detection",

#                 "description": reason,

#                 "confidence_text": f"{predicted_confidence:.2f}%",

#                 "error": None,
#             }

#         except Exception as exc:

#             print("\n========== PREDICTION ERROR ==========")
#             print(exc)
#             print("======================================\n")

#             logger.error(
#                 f"❌ Prediction failed: {exc}"
#             )

#             return {
#                 "success": False,
#                 "error": str(exc)
#             }


# # ==========================================
# # TESTING
# # ==========================================

# if __name__ == "__main__":

#     classifier = BrainTumorClassifier(
#         model_path="agents/image_analysis_agent/brain_tumor_agent/models/model.pth"
#     )

#     result = classifier.predict(
#         "test.jpg"
#     )

#     print("\n========== FINAL RESULT ==========")
#     print(result)
#     print("==================================")

import os
import logging
from typing import Dict, Optional

import torch
import torch.nn as nn
from PIL import Image
from torchvision import transforms
from torchvision.models import efficientnet_b3


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


class BrainTumorClassifier:
    """EfficientNet-B3 based 4-class MRI brain tumor classifier."""

    CLASS_NAMES = [
        "glioma",
        "meningioma",
        "notumor",
        "pituitary"
    ]

    def __init__(
        self,
        model_path: str = "agents/image_analysis_agent/brain_tumor_agent/models/model.pth",
        device: Optional[torch.device] = None,
    ):

        self.model_path = model_path

        self.device = (
            device
            if device
            else torch.device(
                "cuda:0" if torch.cuda.is_available() else "cpu"
            )
        )

        self.transform = transforms.Compose([
            transforms.Resize((300, 300)),
            transforms.ToTensor(),
            transforms.Normalize(
                [0.485, 0.456, 0.406],
                [0.229, 0.224, 0.225]
            ),
        ])

        self.model = self._load_model()

    def _build_model(self):

        model = efficientnet_b3(weights=None)

        model.classifier[1] = nn.Linear(
            model.classifier[1].in_features,
            4
        )

        return model

    def _load_model(self):

        try:

            print("\n========== MODEL DEBUG ==========")
            print("Current Working Directory:", os.getcwd())
            print("Model Path:", self.model_path)
            print("File Exists:", os.path.exists(self.model_path))
            print("=================================\n")

            if not os.path.exists(self.model_path):

                raise FileNotFoundError(
                    f"Model file not found: {self.model_path}"
                )

            model = self._build_model()

            state_dict = torch.load(
                self.model_path,
                map_location=self.device
            )

            model.load_state_dict(state_dict)

            model.to(self.device)

            model.eval()

            logger.info(
                f"Loaded brain tumor classifier from {self.model_path}"
            )

            return model

        except Exception as exc:

            print("\n========== REAL MODEL ERROR ==========")
            print(exc)
            print("======================================\n")

            logger.error(
                f"Failed to load brain tumor classifier: {exc}"
            )

            return None

    def get_reason(self, predicted_class):

        reasons = {

            "glioma":
            "Glioma detected because the MRI scan shows irregular abnormal tissue growth patterns inside the brain region.",

            "meningioma":
            "Meningioma detected because the model identified a well-defined abnormal mass near the outer brain membrane region.",

            "pituitary":
            "Pituitary tumor detected due to abnormal tissue growth near the pituitary gland region.",

            "notumor":
            "No tumor detected because the MRI scan appears structurally normal without visible abnormal masses."
        }

        return reasons.get(
            predicted_class,
            "No explanation available."
        )

    def predict(self, image_path: str) -> Dict[str, Optional[str]]:

        if self.model is None:

            return {
                "success": False,
                "error": "Brain tumor classifier model could not be loaded."
            }

        try:

            image = Image.open(image_path).convert("RGB")

            img = self.transform(image).unsqueeze(0).to(self.device)

            with torch.no_grad():

                outputs = self.model(img)

                probs = torch.softmax(outputs, dim=1)

                confidence, predicted = torch.max(probs, 1)

            predicted_idx = int(predicted.item())

            predicted_label = self.CLASS_NAMES[predicted_idx]

            predicted_confidence = float(confidence.item()) * 100

            reason = self.get_reason(predicted_label)

            logger.info(
                f"Prediction: {predicted_label} | Confidence: {predicted_confidence:.2f}%"
            )

            return {

                 "success": True,

    "prediction": str(predicted_label),

    "confidence": float(predicted_confidence),

    "diagnosis": str(predicted_label).upper(),

    "category": "Brain Tumor Detection",

    "description": str(reason),

    "confidence_text": f"{float(predicted_confidence):.2f}%",

    "error": None,
            }

        except Exception as exc:

            print("\n========== PREDICTION ERROR ==========")
            print(exc)
            print("======================================\n")

            logger.error(
                f"Brain tumor classification failed: {exc}"
            )

            return {
                "success": False,
                "error": str(exc)
            }