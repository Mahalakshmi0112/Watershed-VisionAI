import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import torchvision.transforms as transforms
from sklearn.metrics import f1_score, classification_report, confusion_matrix
from backend.ml.cv_model.model import DualHeadResNet18, STRUCTURE_TYPES, CONDITIONS
from backend.ml.cv_model.bootstrap_dataset import BootstrappedStructureDataset
from backend.config.settings import settings

def train_cv_model(epochs: int = 3, batch_size: int = 16, lr: float = 0.001):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[CV Training] Starting training on device: {device}")

    # Data Augmentation & Normalization
    train_transform = transforms.Compose([
        transforms.RandomRotation(15),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    val_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    # Dataset & Train/Val/Test split
    full_dataset = BootstrappedStructureDataset(num_samples=150, transform=train_transform)
    train_size = int(0.7 * len(full_dataset))
    val_size = int(0.15 * len(full_dataset))
    test_size = len(full_dataset) - train_size - val_size

    train_ds, val_ds, test_ds = random_split(full_dataset, [train_size, val_size, test_size])

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False)

    model = DualHeadResNet18(pretrained=True).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    # Training Loop
    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        for imgs, type_targets, cond_targets in train_loader:
            imgs = imgs.to(device)
            type_targets = type_targets.to(device)
            cond_targets = cond_targets.to(device)

            optimizer.zero_grad()
            type_logits, cond_logits = model(imgs)
            
            loss_type = criterion(type_logits, type_targets)
            loss_cond = criterion(cond_logits, cond_targets)
            loss = loss_type + loss_cond

            loss.backward()
            optimizer.step()
            running_loss += loss.item() * imgs.size(0)

        epoch_loss = running_loss / train_size
        print(f"[Epoch {epoch+1}/{epochs}] Train Loss: {epoch_loss:.4f}")

    # Evaluation on Test Set
    model.eval()
    all_type_preds, all_type_targets = [], []
    all_cond_preds, all_cond_targets = [], []

    with torch.no_grad():
        for imgs, type_targets, cond_targets in test_loader:
            imgs = imgs.to(device)
            type_logits, cond_logits = model(imgs)

            all_type_preds.extend(type_logits.argmax(dim=1).cpu().numpy())
            all_type_targets.extend(type_targets.numpy())

            all_cond_preds.extend(cond_logits.argmax(dim=1).cpu().numpy())
            all_cond_targets.extend(cond_targets.numpy())

    type_f1 = f1_score(all_type_targets, all_type_preds, average="macro", zero_division=0)
    cond_f1 = f1_score(all_cond_targets, all_cond_preds, average="macro", zero_division=0)

    print("\n--- CV Model Evaluation Results ---")
    print(f"Structure Type F1-Score (Macro): {type_f1:.4f}")
    print(f"Structure Condition F1-Score (Macro): {cond_f1:.4f}")
    print("\nCondition Classification Report:")
    print(classification_report(all_cond_targets, all_cond_preds, target_names=CONDITIONS, zero_division=0))
    print("\nCondition Confusion Matrix:")
    print(confusion_matrix(all_cond_targets, all_cond_preds))

    # Save Model Artifact
    checkpoint_path = os.path.join(settings.MODELS_DIR, "cv_resnet18_v1.pt")
    torch.save(model.state_dict(), checkpoint_path)
    print(f"\n[CV Training] Model checkpoint saved successfully to {checkpoint_path}")
    return checkpoint_path

if __name__ == "__main__":
    train_cv_model(epochs=3)
