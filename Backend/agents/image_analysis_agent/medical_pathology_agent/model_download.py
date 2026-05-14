import logging
from typing import Optional, Tuple

import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification


logger = logging.getLogger(__name__)


def _normalize_label(label: str) -> str:
    """Normalize labels for exact class-name matching."""
    return label.strip().lower().replace(" ", "_").replace("-", "_")


def load_hf_checkpoint(
    model_id: str,
    target_labels: list[str],
    device: torch.device,
) -> Tuple[Optional[AutoImageProcessor], Optional[AutoModelForImageClassification], bool]:
    """
    Load a Hugging Face image-classification model and verify class compatibility.

    Returns:
        processor, model, is_compatible
    """
    try:
        processor = AutoImageProcessor.from_pretrained(model_id)
        model = AutoModelForImageClassification.from_pretrained(model_id)
        model.to(device)
        model.eval()

        id2label = getattr(model.config, "id2label", {}) or {}
        available = {_normalize_label(v) for v in id2label.values()}
        required = {_normalize_label(v) for v in target_labels}
        is_compatible = required.issubset(available)

        if is_compatible:
            logger.info("Loaded compatible Hugging Face model: %s", model_id)
        else:
            logger.warning(
                "Loaded Hugging Face model %s, but labels are incompatible with required classes. "
                "Required=%s Available(sample)=%s",
                model_id,
                sorted(required),
                sorted(list(available))[:10],
            )
        return processor, model, is_compatible
    except Exception as exc:
        logger.warning("Could not load Hugging Face model '%s': %s", model_id, exc)
        return None, None, False
