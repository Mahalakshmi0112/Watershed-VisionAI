import torch
import torch.nn as nn
import torchvision.models as models
from typing import Tuple, Dict, Any

# Target classes
STRUCTURE_TYPES = ["check_dam", "farm_pond", "bund", "contour_trench", "other"]
CONDITIONS = ["intact", "minor_damage", "major_damage", "non_functional"]

class DualHeadResNet18(nn.Module):
    """
    Lightweight ResNet18 transfer learning backbone with two classification heads:
    1. Structure Type Head (5 classes)
    2. Condition Head (4 classes)
    """
    def __init__(self, num_types: int = 5, num_conditions: int = 4, pretrained: bool = True):
        super(DualHeadResNet18, self).__init__()
        weights = models.ResNet18_Weights.DEFAULT if pretrained else None
        backbone = models.resnet18(weights=weights)
        
        # Feature extractor up to average pooling
        num_features = backbone.fc.in_features
        self.backbone = nn.Sequential(*list(backbone.children())[:-1])
        
        # Dual classification heads
        self.fc_type = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 128),
            nn.ReLU(),
            nn.Linear(128, num_types)
        )
        
        self.fc_condition = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(num_features, 128),
            nn.ReLU(),
            nn.Linear(128, num_conditions)
        )

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        features = self.backbone(x)
        features = torch.flatten(features, 1)
        type_logits = self.fc_type(features)
        cond_logits = self.fc_condition(features)
        return type_logits, cond_logits

def load_cv_model(checkpoint_path: str = None, device: str = "cpu") -> DualHeadResNet18:
    model = DualHeadResNet18(pretrained=True)
    if checkpoint_path and torch.cuda.is_available() or checkpoint_path:
        try:
            checkpoint = torch.load(checkpoint_path, map_location=device)
            model.load_state_dict(checkpoint)
            print(f"[CV Model] Loaded checkpoint from {checkpoint_path}")
        except Exception as e:
            print(f"[CV Model Warning] Failed to load checkpoint {checkpoint_path} ({e}); using pretrained backbone.")
    model.to(device)
    model.eval()
    return model
