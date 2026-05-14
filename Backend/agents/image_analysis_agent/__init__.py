from typing import Dict, Optional

from .image_classifier import ImageClassifier
from .chest_xray_agent.covid_chest_xray_inference import ChestXRayClassification
from .brain_tumor_agent.brain_tumor_inference import BrainTumorClassifier
from .skin_lesion_agent.skin_lesion_inference import SkinLesionSegmentation
from .blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier

# Deprecated: Use BloodTissuePathologyClassifier instead
# from .medical_pathology_agent.medical_inference import MedicalPathologyClassifier


class ImageAnalysisAgent:
    """
    Agent responsible for processing image uploads and classifying them as medical or non-medical, 
    and determining their type.
    
    Supported Image Classifications:
    - Brain Tumor Detection (MRI images)
    - Chest X-ray Analysis (COVID detection)
    - Skin Lesion Segmentation
    - Blood & Tissue Pathology Classification (Blood diseases and lung pathology)
    """

    def __init__(self, config):
        self.image_classifier = ImageClassifier(vision_model=config.medical_cv.llm)
        self.chest_xray_agent = ChestXRayClassification(model_path=config.medical_cv.chest_xray_model_path)
        self.brain_tumor_agent = BrainTumorClassifier(model_path=config.medical_cv.brain_tumor_model_path)
        self.skin_lesion_agent = SkinLesionSegmentation(model_path=config.medical_cv.skin_lesion_model_path)
        
        # Unified Blood and Tissue Pathology Classifier (replaces separate medical_pathology_agent)
        self.blood_tissue_pathology_agent = BloodTissuePathologyClassifier(
            model_path=config.medical_cv.blood_tissue_pathology_model_path,
        )
        
        # Deprecated: medical_pathology_agent is now integrated into blood_tissue_pathology_agent
        # self.medical_pathology_agent = MedicalPathologyClassifier(...)
        
        self.skin_lesion_segmentation_output_path = config.medical_cv.skin_lesion_segmentation_output_path

    # classify image
    def analyze_image(self, image_path: str) -> str:
        """Classifies images as medical or non-medical and determines their type."""
        return self.image_classifier.classify_image(image_path)

    # chest x-ray agent
    def classify_chest_xray(self, image_path: str) -> str:
        return self.chest_xray_agent.predict(image_path)

    # brain tumor agent
    def classify_brain_tumor(self, image_path: str) -> Dict[str, Optional[str]]:
        return self.brain_tumor_agent.predict(image_path)

    # skin lesion agent
    def segment_skin_lesion(self, image_path: str) -> str:
        return self.skin_lesion_agent.predict(image_path, self.skin_lesion_segmentation_output_path)

    # blood & tissue pathology agent (unified - replaces medical_pathology_agent)
    def classify_blood_tissue_pathology(self, image_path: str) -> Dict[str, object]:
        """
        Classify blood and tissue pathology images.
        
        Supported Conditions:
        - Blood Diseases: Iron Deficiency Anemia, Thalassemia, Chronic Myeloid Leukemia
        - Tissue Pathology: Lung Pathology
        
        Args:
            image_path: Path to the pathology image
            
        Returns:
            Dictionary with prediction results including confidence, category, and description
        """
        return self.blood_tissue_pathology_agent.predict(image_path)
    
    # Deprecated: Use classify_blood_tissue_pathology instead
    def classify_medical_pathology(self, image_path: str) -> Dict[str, object]:
        """Deprecated: Use classify_blood_tissue_pathology instead."""
        return self.classify_blood_tissue_pathology(image_path)
