# Blood & Tissue Pathology Agent - SETUP GUIDE

## Quick Start

This guide will help you set up the new unified Blood & Tissue Pathology Agent in your MAGIC medical chatbot system.

## Prerequisites

- Python 3.8+
- PyTorch with CUDA support (recommended) or CPU-only
- The pre-trained model file (model.pth)

## Installation Steps

### Step 1: Model File Setup

1. **Locate your trained model file**
   - You should have a `model.pth` file from your training process

2. **Place the model in the correct directory**
   ```bash
   # Create the models directory if it doesn't exist
   mkdir -p agents/image_analysis_agent/blood_tissue_pathology_agent/models
   
   # Copy your model to this directory
   cp /path/to/your/model.pth agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth
   ```

### Step 2: Verify Installation

Run the test suite to verify everything is set up correctly:

```bash
python test_blood_tissue_pathology.py
```

**Expected Output:**
```
════════════════════════════════════════════════════════════
█                                                          █
█  BLOOD & TISSUE PATHOLOGY CLASSIFIER - TEST SUITE       █
█                                                          █
════════════════════════════════════════════════════════════

[TEST 1/4] Model Loading...
🔍 Checking model at: ./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth
✅ Model file found!
📊 File size: XX.XX MB
✅ Model loaded successfully!
🖥️  Device: cuda:0

[TEST 2/4] Supported Classes...
...

[TEST 3/4] Single Image Prediction...
...

[TEST 4/4] Batch Prediction...
...
```

### Step 3: Verify Configuration

The configuration is already updated in `config.py`:

```python
# Check MedicalCVConfig class
class MedicalCVConfig:
    def __init__(self):
        # ... other configs ...
        self.blood_tissue_pathology_model_path = "./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
        self.blood_tissue_pathology_confidence_threshold = 0.6
```

## Model Format Requirements

### Architecture
- **Type**: ResNet18
- **Input Size**: 224×224 RGB
- **Output Classes**: 4
- **Framework**: PyTorch

### Model File Format

The model should be saved as a PyTorch state dict:

```python
import torch
from torchvision.models import resnet18

# Build model architecture
model = resnet18(weights=None)
model.fc = torch.nn.Linear(model.fc.in_features, 4)

# Load your trained weights
checkpoint = torch.load("your_trained_model.pth")
model.load_state_dict(checkpoint)

# Save in compatible format
torch.save(model.state_dict(), 
    "agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth")
```

### Supported Checkpoint Formats

The loader supports two formats:

**Format 1: Direct State Dict**
```python
torch.save(model.state_dict(), path)  # Saves weights directly
```

**Format 2: Wrapped Checkpoint**
```python
torch.save({"state_dict": model.state_dict()}, path)  # Wrapped in dict
```

## Usage Examples

### Example 1: Direct Classification

```python
from agents.image_analysis_agent.blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier

# Initialize
classifier = BloodTissuePathologyClassifier(
    model_path="./agents/image_analysis_agent/blood_tissue_pathology_agent/models/model.pth"
)

# Predict on single image
result = classifier.predict("pathology_image.jpg")

if result["success"]:
    print(f"Diagnosis: {result['prediction']}")
    print(f"Category: {result['category']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Description: {result['description']}")
else:
    print(f"Error: {result['error']}")
```

### Example 2: Batch Processing

```python
# Predict on multiple images
images = ["image1.jpg", "image2.jpg", "image3.jpg"]
results = classifier.predict_batch(images)

for result in results:
    if result["success"]:
        print(f"✅ {result['prediction']} ({result['confidence']:.2%})")
    else:
        print(f"❌ {result['error']}")
```

### Example 3: Through Web API

```bash
# Upload image for classification
curl -X POST http://localhost:8001/predict-medical \
  -F "image=@pathology_image.jpg"

# Response
{
    "prediction": "chronic_myeloid_leukemia",
    "confidence": 0.92,
    "category": "Blood Disease",
    "description": "Chronic Myeloid Leukemia (CML) - A type of blood cancer"
}
```

### Example 4: Through Chatbot

Simply upload a pathology image to the chatbot and it will automatically:
1. Detect that it's a pathology image
2. Route to the Medical Pathology Agent
3. Classify the condition
4. Return diagnosis with confidence scores

## Supported Classifications

### Blood Diseases (3 classes)

| Condition | Description |
|-----------|-------------|
| **Iron Deficiency Anemia** | Insufficient iron levels leading to reduced hemoglobin |
| **Thalassemia** | Inherited blood disorder affecting hemoglobin production |
| **Chronic Myeloid Leukemia** | Blood cancer affecting myeloid cells |

### Tissue Pathology (1 class)

| Condition | Description |
|-----------|-------------|
| **Lung Pathology** | Abnormal tissue or disease condition in the lungs |

## Configuration Options

### Environment Variables

```bash
# Optional: Set confidence threshold (0.0 to 1.0, default: 0.6)
export BLOOD_TISSUE_PATHOLOGY_CONFIDENCE_THRESHOLD=0.65
```

### Programmatic Configuration

```python
from config import Config
from agents.image_analysis_agent.blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier

config = Config()

classifier = BloodTissuePathologyClassifier(
    model_path=config.medical_cv.blood_tissue_pathology_model_path,
    device=torch.device("cuda" if torch.cuda.is_available() else "cpu")
)
```

## Troubleshooting

### Issue: "Model file not found"

**Solution:**
1. Verify the file exists at the correct path
2. Check file permissions
3. Use absolute path if relative path doesn't work

```bash
# List files to verify
ls -la agents/image_analysis_agent/blood_tissue_pathology_agent/models/
```

### Issue: "CUDA out of memory"

**Solution:**
1. Clear CUDA cache
2. Reduce batch size
3. Use CPU mode

```python
classifier = BloodTissuePathologyClassifier(
    model_path="...",
    device=torch.device("cpu")  # Force CPU
)
```

### Issue: "Invalid or corrupted image"

**Solution:**
1. Verify image format (PNG, JPG, JPEG)
2. Test with different image
3. Use PIL to verify image integrity

```python
from PIL import Image
img = Image.open("image.jpg")
img.verify()
```

### Issue: Import errors

**Solution:**
1. Verify all `__init__.py` files exist in the agent directories
2. Check that you're running from the project root directory
3. Clear Python cache

```bash
# Clear cache
find . -type d -name __pycache__ -exec rm -r {} +

# Check directory structure
ls -la agents/image_analysis_agent/blood_tissue_pathology_agent/
```

## Performance Tuning

### GPU Acceleration

To ensure GPU is being used:

```python
import torch
from agents.image_analysis_agent.blood_tissue_pathology_agent.pathology_inference import BloodTissuePathologyClassifier

classifier = BloodTissuePathologyClassifier(...)

# Check device
print(classifier.device)  # Should show: cuda:0

# Verify GPU memory usage
print(f"GPU Memory: {torch.cuda.memory_allocated() / 1024**3:.2f} GB")
```

### Batch Processing Optimization

For multiple images, batch processing is more efficient:

```python
# Slower: Process one by one
for image in images:
    result = classifier.predict(image)

# Faster: Batch processing
results = classifier.predict_batch(images)
```

### Expected Performance

| Device | Speed | Memory |
|--------|-------|--------|
| NVIDIA GPU (CUDA) | ~100-200ms/image | ~2-3GB VRAM |
| CPU (Intel i7) | ~500-1000ms/image | ~500MB RAM |

## Integration with MAGIC System

### 1. In Agent Decision System

The agent automatically routes pathology images:

```python
# Automatic routing in agent_decision.py
if image_type in ["BLOOD SMEAR", "PATHOLOGY", "BLOOD", "TISSUE"]:
    route_to("MEDICAL_PATHOLOGY_AGENT")
```

### 2. In Image Analysis Agent

```python
from agents.image_analysis_agent import ImageAnalysisAgent
from config import Config

config = Config()
agent = ImageAnalysisAgent(config)

# Classify pathology images
result = agent.classify_blood_tissue_pathology("image.jpg")
```

### 3. In FastAPI Application

Already integrated in `/predict-medical` endpoint:

```bash
curl -X POST http://localhost:8001/predict-medical -F "image=@image.jpg"
```

## Next Steps

1. ✅ **Place model file** in `models/` directory
2. ✅ **Run tests** with `python test_blood_tissue_pathology.py`
3. ✅ **Start application** - system ready to use
4. ✅ **Upload images** through chatbot or API

## Documentation

- [Detailed Module Documentation](agents/image_analysis_agent/blood_tissue_pathology_agent/README.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [Test Suite](test_blood_tissue_pathology.py)

## Support

### Common Questions

**Q: Can I use the model on CPU?**
A: Yes, the system automatically detects and uses GPU if available, falls back to CPU.

**Q: What image formats are supported?**
A: PNG, JPG, JPEG. Images are automatically resized to 224×224.

**Q: How long does prediction take?**
A: ~100-200ms on GPU, ~500-1000ms on CPU per image.

**Q: Can I run multiple predictions in parallel?**
A: Use batch processing for efficiency or run in separate threads.

**Q: Is a medical professional review required?**
A: Yes! This is a computer-aided diagnosis tool and should always be reviewed by qualified medical professionals.

## System Compatibility

- ✅ Windows (tested)
- ✅ Linux (compatible)
- ✅ macOS (compatible)
- ✅ Docker (compatible)

## Version Information

- **Created**: 2024
- **Python**: 3.8+
- **PyTorch**: 1.9+
- **Status**: Production Ready

---

For additional help or issues, refer to the comprehensive README in the agent directory or the IMPLEMENTATION_SUMMARY.md file.
