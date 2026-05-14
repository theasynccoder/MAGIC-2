"""
Sample script demonstrating the Blood & Tissue Pathology Classifier

This script shows how to use the unified pathology classification agent
for both single image and batch predictions.
"""

import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from agents.image_analysis_agent.blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def test_single_prediction():
    """Test single image prediction."""
    print("\n" + "="*60)
    print("SINGLE IMAGE PREDICTION TEST")
    print("="*60)
    
    # Initialize classifier
    classifier = BloodTissuePathologyClassifier(
        model_path="./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
    )
    
    # Example image path (replace with actual image)
    test_image_path = "sample_images/pathology_sample.jpg"
    
    if os.path.exists(test_image_path):
        print(f"\n📸 Testing with image: {test_image_path}")
        result = classifier.predict(test_image_path)
        
        if result["success"]:
            print(f"\n✅ Prediction successful!")
            print(f"   Diagnosis: {result['prediction'].upper().replace('_', ' ')}")
            print(f"   Category: {result['category']}")
            print(f"   Confidence: {result['confidence']:.2%}")
            print(f"   Description: {result['description']}")
        else:
            print(f"\n❌ Prediction failed: {result['error']}")
    else:
        print(f"\n⚠️  Test image not found: {test_image_path}")
        print("   To test, place a pathology image at the path above.")


def test_batch_prediction():
    """Test batch prediction on multiple images."""
    print("\n" + "="*60)
    print("BATCH PREDICTION TEST")
    print("="*60)
    
    # Initialize classifier
    classifier = BloodTissuePathologyClassifier(
        model_path="./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
    )
    
    # Example image paths
    test_images = [
        "sample_images/blood_sample1.jpg",
        "sample_images/blood_sample2.jpg",
        "sample_images/lung_pathology.jpg"
    ]
    
    print(f"\n📸 Testing batch prediction with {len(test_images)} images...")
    
    # Filter to only existing images
    existing_images = [img for img in test_images if os.path.exists(img)]
    
    if existing_images:
        results = classifier.predict_batch(existing_images)
        
        print(f"\n{'Image':<30} {'Prediction':<30} {'Confidence':<12} {'Category':<15}")
        print("-"*87)
        
        for i, result in enumerate(results):
            if result["success"]:
                pred = result['prediction'].upper().replace('_', ' ')
                conf = f"{result['confidence']:.2%}"
                category = result['category']
                print(f"{existing_images[i]:<30} {pred:<30} {conf:<12} {category:<15}")
            else:
                print(f"{existing_images[i]:<30} {'ERROR':<30} {'N/A':<12} {'N/A':<15}")
    else:
        print("\n⚠️  No test images found. Create sample images or use existing ones.")


def test_class_information():
    """Display supported classes and descriptions."""
    print("\n" + "="*60)
    print("SUPPORTED CLASSES & DESCRIPTIONS")
    print("="*60)
    
    classifier = BloodTissuePathologyClassifier(
        model_path="./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
    )
    
    print("\n📋 BLOOD DISEASES:")
    print("-"*60)
    blood_diseases = [
        "iron_deficiency_anemia",
        "thalassemia",
        "chronic_myeloid_leukemia"
    ]
    for disease in blood_diseases:
        desc = classifier.CLASS_DESCRIPTIONS.get(disease, "No description")
        print(f"  • {disease.upper().replace('_', ' ')}")
        print(f"    → {desc}\n")
    
    print("📋 TISSUE PATHOLOGY:")
    print("-"*60)
    tissue_disease = "lung_pathology"
    desc = classifier.CLASS_DESCRIPTIONS.get(tissue_disease, "No description")
    print(f"  • {tissue_disease.upper().replace('_', ' ')}")
    print(f"    → {desc}\n")


def test_model_loading():
    """Test if model loads correctly."""
    print("\n" + "="*60)
    print("MODEL LOADING TEST")
    print("="*60)
    
    model_path = "./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
    
    print(f"\n🔍 Checking model at: {model_path}")
    
    if os.path.exists(model_path):
        file_size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"   ✅ Model file found!")
        print(f"   📊 File size: {file_size_mb:.2f} MB")
    else:
        print(f"   ❌ Model file not found!")
        print(f"   📝 Please place model at: {model_path}")
        return False
    
    try:
        classifier = BloodTissuePathologyClassifier(
            model_path=model_path
        )
        if classifier.model is not None:
            print(f"   ✅ Model loaded successfully!")
            print(f"   🖥️  Device: {classifier.device}")
            return True
        else:
            print(f"   ❌ Failed to load model weights!")
            return False
    except Exception as e:
        print(f"   ❌ Error during model loading: {e}")
        return False


def main():
    """Run all tests."""
    print("\n" + "█"*60)
    print("█" + " "*58 + "█")
    print("█  BLOOD & TISSUE PATHOLOGY CLASSIFIER - TEST SUITE  " + " "*2 + "█")
    print("█" + " "*58 + "█")
    print("█"*60)
    
    # Test 1: Model Loading
    print("\n[TEST 1/4] Model Loading...")
    if not test_model_loading():
        print("\n⚠️  Model not available. Skipping remaining tests.")
        print("Please ensure the model.pth file is placed in the correct directory.")
        return
    
    # Test 2: Class Information
    print("\n[TEST 2/4] Supported Classes...")
    test_class_information()
    
    # Test 3: Single Prediction
    print("\n[TEST 3/4] Single Image Prediction...")
    test_single_prediction()
    
    # Test 4: Batch Prediction
    print("\n[TEST 4/4] Batch Prediction...")
    test_batch_prediction()
    
    print("\n" + "█"*60)
    print("█  TEST SUITE COMPLETED                               " + " "*7 + "█")
    print("█"*60 + "\n")


if __name__ == "__main__":
    main()
