import os
import torch
import pytest
from PIL import Image
from backend.ml.cv_model.model import DualHeadResNet18
from backend.ml.cv_model.gradcam_engine import create_gradcam_overlay

def test_dual_head_resnet_forward():
    model = DualHeadResNet18(pretrained=False)
    model.eval()

    dummy_input = torch.randn(2, 3, 224, 224)
    type_logits, cond_logits = model(dummy_input)

    assert type_logits.shape == (2, 5)  # 5 structure types
    assert cond_logits.shape == (2, 4)  # 4 conditions

def test_gradcam_generator(tmp_path):
    img_path = str(tmp_path / "sample_photo.jpg")
    out_path = str(tmp_path / "gradcam_output.jpg")
    
    img = Image.new("RGB", (300, 300), color="green")
    img.save(img_path)

    model = DualHeadResNet18(pretrained=False)
    saved_path = create_gradcam_overlay(img_path, out_path, model=model)
    
    assert os.path.exists(saved_path)
    assert os.path.getsize(saved_path) > 0
