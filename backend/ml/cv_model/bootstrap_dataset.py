import os
import random
from PIL import Image, ImageDraw
import torch
from torch.utils.data import Dataset
import torchvision.transforms as transforms
from backend.ml.cv_model.model import STRUCTURE_TYPES, CONDITIONS

class BootstrappedStructureDataset(Dataset):
    """
    Bootstrapped dataset generator for Watershed structure classification.
    Generates synthetic sample images with varied visual patterns and ground-truth dual labels.
    """
    def __init__(self, num_samples: int = 120, transform=None):
        self.num_samples = num_samples
        self.transform = transform
        self.samples = []
        self._generate_samples()

    def _generate_samples(self):
        random.seed(42)
        for i in range(self.num_samples):
            type_idx = random.randint(0, len(STRUCTURE_TYPES) - 1)
            cond_idx = random.randint(0, len(CONDITIONS) - 1)
            
            # Base color based on structure type
            if type_idx == 0:  # check_dam
                base_color = (160, 160, 160)
            elif type_idx == 1:  # farm_pond
                base_color = (50, 120, 200)
            elif type_idx == 2:  # bund
                base_color = (140, 100, 60)
            elif type_idx == 3:  # contour_trench
                base_color = (80, 140, 70)
            else:
                base_color = (200, 180, 150)

            # Modify image based on condition damage
            img = Image.new("RGB", (224, 224), color=base_color)
            draw = ImageDraw.Draw(img)

            if cond_idx == 1:  # minor_damage
                draw.line([(50, 50), (100, 100)], fill=(40, 40, 40), width=3)
            elif cond_idx == 2:  # major_damage
                draw.line([(30, 30), (180, 180)], fill=(20, 20, 20), width=6)
                draw.rectangle([(80, 80), (140, 140)], fill=(60, 40, 20))
            elif cond_idx == 3:  # non_functional
                draw.rectangle([(20, 20), (200, 200)], fill=(30, 30, 30))

            self.samples.append((img, type_idx, cond_idx))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        img, type_idx, cond_idx = self.samples[idx]
        if self.transform:
            img = self.transform(img)
        return img, torch.tensor(type_idx, dtype=torch.long), torch.tensor(cond_idx, dtype=torch.long)
