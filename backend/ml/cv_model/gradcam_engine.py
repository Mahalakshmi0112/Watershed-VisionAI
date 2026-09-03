import os
import cv2
import numpy as np
import torch
import torchvision.transforms as transforms
from PIL import Image
from typing import Optional

class GradCAM:
    def __init__(self, model, target_layer_name: str = "7"):
        self.model = model
        self.model.eval()
        self.gradients = None
        self.activations = None

        target_layer = self.model.backbone[int(target_layer_name)]
        target_layer.register_forward_hook(self._save_activation)
        target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self.activations = output

    def _save_gradient(self, module, grad_input, grad_output):
        self.gradients = grad_output[0]

    def generate_heatmap(self, input_tensor: torch.Tensor, class_idx: Optional[int] = None) -> np.ndarray:
        type_logits, cond_logits = self.model(input_tensor)
        
        if class_idx is None:
            class_idx = cond_logits.argmax(dim=1).item()

        self.model.zero_grad()
        target = cond_logits[0, class_idx]
        target.backward()

        gradients = self.gradients.data.cpu().numpy()[0]
        activations = self.activations.data.cpu().numpy()[0]

        weights = np.mean(gradients, axis=(1, 2))
        cam = np.zeros(activations.shape[1:], dtype=np.float32)

        for i, w in enumerate(weights):
            cam += w * activations[i, :, :]

        cam = np.maximum(cam, 0)
        if cam.max() > 0:
            cam = cam / cam.max()
            
        cam = cv2.resize(cam, (224, 224))
        return cam

def create_gradcam_overlay(image_path: str, output_path: str, model=None) -> str:
    """
    Generate Grad-CAM heatmap overlay for a field photo and save as output_path.
    Returns output_path.
    """
    try:
        raw_img = Image.open(image_path).convert("RGB")
        orig_w, orig_h = raw_img.size
        
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        input_tensor = transform(raw_img).unsqueeze(0)

        if model is None:
            from backend.ml.cv_model.model import DualHeadResNet18
            model = DualHeadResNet18(pretrained=True)

        grad_cam = GradCAM(model, target_layer_name="7")
        heatmap = grad_cam.generate_heatmap(input_tensor)

        heatmap_uint8 = np.uint8(255 * heatmap)
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, cv2.COLORMAP_JET)

        orig_np = np.array(raw_img.resize((224, 224)))
        orig_bgr = cv2.cvtColor(orig_np, cv2.COLOR_RGB2BGR)

        overlay = cv2.addWeighted(orig_bgr, 0.6, heatmap_colored, 0.4, 0)
        overlay_resized = cv2.resize(overlay, (orig_w, orig_h))

        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)

        cv2.imwrite(output_path, overlay_resized)
        return output_path
    except Exception as e:
        print(f"[Grad-CAM Error] Failed to generate overlay ({e}). Returning original image path.")
        return image_path
