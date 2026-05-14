# Blood & Tissue Pathology Classification Agent

## Overview

The **Blood & Tissue Pathology Classification Agent** is a unified production-grade system for classifying pathological diseases from medical images. It consolidates functionality previously spread across separate agents into one coherent, maintainable system.

## Supported Classifications

### Blood Diseases (4 classes)
- **Iron Deficiency Anemia** - A condition characterized by insufficient iron levels leading to reduced hemoglobin production
- **Thalassemia** - An inherited blood disorder affecting hemoglobin production
- **Chronic Myeloid Leukemia (CML)** - A type of blood cancer affecting myeloid cells
- **Lung Pathology** - Abnormal tissue or disease condition in the lungs

## Architecture

### Model Specifications
- **Architecture**: ResNet18
- **Input Size**: 224×224 pixels (RGB)
- **Output Classes**: 4
- **Preprocessing**: ImageNet standard normalization
  - Mean: [0.485, 0.456, 0.406]
  - Std: [0.229, 0.224, 0.225]

### Device Support
- **GPU**: Automatic CUDA detection and usage
- **CPU**: Fallback support for environments without GPU

## Usage

### Basic Classification

```python
from agents.image_analysis_agent.blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier

# Initialize classifier
classifier = BloodTissuePathologyClassifier(
    model_path="./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
)

# Predict on a single image
result = classifier.predict("path/to/pathology/image.jpg")

if result["success"]:
    print(f"Diagnosis: {result['prediction']}")
    print(f"Category: {result['category']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Description: {result['description']}")
else:
    print(f"Error: {result['error']}")
```

### Batch Classification

```python
image_paths = [
    "image1.jpg",
    "image2.jpg",
    "image3.jpg"
]

results = classifier.predict_batch(image_paths)

for result in results:
    if result["success"]:
        print(f"✅ {result['prediction']} (Confidence: {result['confidence']:.2%})")
    else:
        print(f"❌ Error: {result['error']}")
```

## Response Format

### Successful Prediction
```python
{
    "success": True,
    "prediction": "chronic_myeloid_leukemia",  # Class name
    "confidence": 0.92,                         # 0.0 to 1.0
    "category": "Blood Disease",                # Category type
    "description": "Chronic Myeloid Leukemia (CML) - A type of blood cancer",
    "error": None
}
```

### Failed Prediction
```python
{
    "success": False,
    "prediction": None,
    "confidence": None,
    "category": None,
    "description": None,
    "error": "Model file not found at specified path"
}
```

## Class Mappings

```python
CLASS_NAMES = [
    "iron_deficiency_anemia",           # Index 0
    "thalassemia",                      # Index 1
    "chronic_myeloid_leukemia",         # Index 2
    "lung_pathology"                    # Index 3
]

CLASS_DESCRIPTIONS = {
    "iron_deficiency_anemia": "Iron Deficiency Anemia - A condition characterized by insufficient iron levels",
    "thalassemia": "Thalassemia - An inherited blood disorder affecting hemoglobin production",
    "chronic_myeloid_leukemia": "Chronic Myeloid Leukemia (CML) - A type of blood cancer",
    "lung_pathology": "Lung Pathology - Abnormal tissue or disease condition in the lungs"
}

DISEASE_CATEGORIES = {
    "iron_deficiency_anemia": "Blood Disease",
    "thalassemia": "Blood Disease",
    "chronic_myeloid_leukemia": "Blood Disease",
    "lung_pathology": "Tissue Pathology"
}
```

## Model Loading

### Local Model
The agent prefers loading from a local trained model file:
```
./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth
```

### Model Checkpoint Format
The agent supports two checkpoint formats:
1. **Direct state dict**: Model weights directly saved
2. **Wrapped checkpoint**: `{"state_dict": {...}}` format

## Integration with Main System

### Through ImageAnalysisAgent
```python
from agents.image_analysis_agent import ImageAnalysisAgent
from config import Config

config = Config()
image_agent = ImageAnalysisAgent(config)

# Use unified classifier
result = image_agent.classify_blood_tissue_pathology("path/to/image.jpg")
```

### Through API Endpoint
```bash
curl -X POST http://localhost:8001/predict-medical \
  -F "image=@pathology_image.jpg"
```

Response:
```json
{
    "prediction": "chronic_myeloid_leukemia",
    "confidence": 0.92,
    "category": "Blood Disease",
    "description": "Chronic Myeloid Leukemia (CML) - A type of blood cancer"
}
```

## Configuration

### Environment Variables
```bash
# Optional: Set confidence threshold (default: 0.6)
export BLOOD_TISSUE_PATHOLOGY_CONFIDENCE_THRESHOLD=0.65
```

### Config File
```python
# config.py
class MedicalCVConfig:
    def __init__(self):
        self.blood_tissue_pathology_model_path = "./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
        self.blood_tissue_pathology_confidence_threshold = float(
            os.getenv("BLOOD_TISSUE_PATHOLOGY_CONFIDENCE_THRESHOLD", "0.6")
        )
```

## Performance Considerations

### Input Image Requirements
- **Format**: PNG, JPG, JPEG
- **Size**: Automatically resized to 224×224
- **Color Space**: RGB (converted automatically)
- **File Size Limit**: 5MB (configurable)

### Inference Time
- **GPU (CUDA)**: ~100-200ms per image
- **CPU**: ~500-1000ms per image
- **Batch Processing**: Efficient for multiple images

## Error Handling

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| "Model file not found" | Model path incorrect | Verify path in config.py |
| "Invalid or corrupted image" | Image format issue | Ensure valid PNG/JPG/JPEG |
| "File too large" | Exceeds size limit | Compress image or increase limit |
| CUDA OOM error | GPU memory exhausted | Use CPU or reduce batch size |

## Logging

The agent provides comprehensive logging:

```python
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)

# Logs will show:
# ✅ Loaded blood/tissue pathology classifier from /path/to/model.pth
# ✅ Pathology classification -> class=chronic_myeloid_leukemia, confidence=0.9234
# ❌ Failed to load pathology classifier: ...
```

## Deprecation Notes

### Deprecated Components
- `MedicalPathologyClassifier` - Use `BloodTissuePathologyClassifier` instead
- `classify_medical_pathology()` - Use `classify_blood_tissue_pathology()` instead
- `medical_pathology_agent` directory - Consolidated into `blood_tissue_pathology_agent`

### Migration Guide

**Before (Old System):**
```python
from agents.image_analysis_agent.medical_pathology_agent.medical_inference import MedicalPathologyClassifier
classifier = MedicalPathologyClassifier(...)
result = classifier.predict_image(image_path)
```

**After (New Unified System):**
```python
from agents.image_analysis_agent.blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier
classifier = BloodTissuePathologyClassifier(...)
result = classifier.predict(image_path)
```

## Testing

```python
# test_pathology_agent.py
from agents.image_analysis_agent.blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier

classifier = BloodTissuePathologyClassifier(
    model_path="./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
)

# Test with sample image
result = classifier.predict("sample_images/pathology_sample.jpg")
print(result)
```

## Production Deployment

### Best Practices
1. **Model Caching**: Initialize classifier once, reuse for multiple predictions
2. **Error Handling**: Always check `success` flag before accessing predictions
3. **Validation**: Request medical professional review of results
4. **Logging**: Enable debug logging for troubleshooting
5. **GPU Usage**: Monitor CUDA memory for batch operations

### Disclaimer
⚠️ This is a computer-aided diagnosis tool and should always be reviewed by a qualified medical professional before clinical use.

## References

- Model Architecture: ResNet18 (He et al., 2016)
- Preprocessing: ImageNet Standard
- Framework: PyTorch
