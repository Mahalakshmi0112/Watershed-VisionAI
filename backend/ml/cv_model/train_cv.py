import os
from pathlib import Path
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
import torchvision.transforms as transforms
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay
)
from backend.ml.cv_model.model import DualHeadResNet18, STRUCTURE_TYPES, CONDITIONS
from backend.ml.cv_model.bootstrap_dataset import BootstrappedStructureDataset
from backend.config.settings import settings

def train_cv_model(epochs: int = 5, batch_size: int = 16, lr: float = 0.001):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print("=" * 70)
    print("[CV Training] DATASET NOTICE:")
    print("  * This dataset is synthetically generated via bootstrap_dataset.py.")
    print("  * It uses procedural shapes, textures, and synthetic damage overlays.")
    print("  * It is NOT composed of real field photographs.")
    print("=" * 70)
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

    # Generate full dataset
    num_total = 160
    full_dataset = BootstrappedStructureDataset(num_samples=num_total, transform=None)
    
    # Train / Val split (80% train, 20% held-out validation)
    train_size = int(0.80 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    
    generator = torch.Generator().manual_seed(42)
    train_subset, val_subset = random_split(full_dataset, [train_size, val_size], generator=generator)

    class TransformedDataset(torch.utils.data.Dataset):
        def __init__(self, subset, transform):
            self.subset = subset
            self.transform = transform
        def __len__(self):
            return len(self.subset)
        def __getitem__(self, idx):
            img, type_target, cond_target = self.subset[idx]
            if self.transform:
                img = self.transform(img)
            return img, type_target, cond_target

    train_ds = TransformedDataset(train_subset, train_transform)
    val_ds = TransformedDataset(val_subset, val_transform)

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

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

    # Evaluation on Held-Out Validation Split
    model.eval()
    all_type_preds, all_type_targets = [], []
    all_cond_preds, all_cond_targets = [], []

    with torch.no_grad():
        for imgs, type_targets, cond_targets in val_loader:
            imgs = imgs.to(device)
            type_logits, cond_logits = model(imgs)

            all_type_preds.extend(type_logits.argmax(dim=1).cpu().numpy())
            all_type_targets.extend(type_targets.cpu().numpy())

            all_cond_preds.extend(cond_logits.argmax(dim=1).cpu().numpy())
            all_cond_targets.extend(cond_targets.cpu().numpy())

    # --- Metrics Computation: Structure-Type Head ---
    type_acc = accuracy_score(all_type_targets, all_type_preds)
    type_prec_macro = precision_score(all_type_targets, all_type_preds, average="macro", zero_division=0)
    type_rec_macro = recall_score(all_type_targets, all_type_preds, average="macro", zero_division=0)
    type_f1_macro = f1_score(all_type_targets, all_type_preds, average="macro", zero_division=0)

    # --- Metrics Computation: Condition Head ---
    cond_acc = accuracy_score(all_cond_targets, all_cond_preds)
    cond_prec_macro = precision_score(all_cond_targets, all_cond_preds, average="macro", zero_division=0)
    cond_rec_macro = recall_score(all_cond_targets, all_cond_preds, average="macro", zero_division=0)
    cond_f1_macro = f1_score(all_cond_targets, all_cond_preds, average="macro", zero_division=0)

    print("\n" + "=" * 70)
    print("CV MODEL EVALUATION RESULTS (HELD-OUT VALIDATION SET, N = {})".format(len(val_ds)))
    print("NOTE: Evaluated on synthetic/weakly-labeled dataset from bootstrap_dataset.py")
    print("=" * 70)

    print("\n[1] STRUCTURE-TYPE HEAD METRICS:")
    print(f"  Accuracy:         {type_acc:.4f} ({type_acc*100:.2f}%)")
    print(f"  Macro Precision:  {type_prec_macro:.4f}")
    print(f"  Macro Recall:     {type_rec_macro:.4f}")
    print(f"  Macro F1-Score:   {type_f1_macro:.4f}")
    print("\n  Per-Class Classification Report (Structure Type):")
    print(classification_report(all_type_targets, all_type_preds, target_names=STRUCTURE_TYPES, zero_division=0))

    print("\n[2] CONDITION HEAD METRICS:")
    print(f"  Accuracy:         {cond_acc:.4f} ({cond_acc*100:.2f}%)")
    print(f"  Macro Precision:  {cond_prec_macro:.4f}")
    print(f"  Macro Recall:     {cond_rec_macro:.4f}")
    print(f"  Macro F1-Score:   {cond_f1_macro:.4f}")
    print("\n  Per-Class Classification Report (Condition):")
    print(classification_report(all_cond_targets, all_cond_preds, target_names=CONDITIONS, zero_division=0))

    # --- Confusion Matrix Plots ---
    results_dirs = [
        Path(__file__).resolve().parent.parent.parent.parent / "results",
        Path(__file__).resolve().parent.parent / "results"
    ]
    for r_dir in results_dirs:
        r_dir.mkdir(parents=True, exist_ok=True)

    # Plot Structure Type Confusion Matrix
    cm_type = confusion_matrix(all_type_targets, all_type_preds, labels=list(range(len(STRUCTURE_TYPES))))
    fig_type, ax_type = plt.subplots(figsize=(8, 6))
    disp_type = ConfusionMatrixDisplay(confusion_matrix=cm_type, display_labels=STRUCTURE_TYPES)
    disp_type.plot(ax=ax_type, cmap="Blues", values_format="d", xticks_rotation=30)
    ax_type.set_title("Structure Type Head — Confusion Matrix\n(Synthetic Dataset: bootstrap_dataset.py)", fontsize=11, fontweight="bold")
    plt.tight_layout()
    for r_dir in results_dirs:
        fig_type.savefig(r_dir / "cm_structure_type.png", dpi=200)
    plt.close(fig_type)

    # Plot Condition Confusion Matrix
    cm_cond = confusion_matrix(all_cond_targets, all_cond_preds, labels=list(range(len(CONDITIONS))))
    fig_cond, ax_cond = plt.subplots(figsize=(8, 6))
    disp_cond = ConfusionMatrixDisplay(confusion_matrix=cm_cond, display_labels=CONDITIONS)
    disp_cond.plot(ax=ax_cond, cmap="Greens", values_format="d", xticks_rotation=20)
    ax_cond.set_title("Condition Head — Confusion Matrix\n(Synthetic Dataset: bootstrap_dataset.py)", fontsize=11, fontweight="bold")
    plt.tight_layout()
    for r_dir in results_dirs:
        fig_cond.savefig(r_dir / "cm_condition.png", dpi=200)
    plt.close(fig_cond)

    print(f"\n[Plots Saved] Confusion matrices saved to results/cm_structure_type.png and results/cm_condition.png")

    # Save Model Artifact
    checkpoint_path = os.path.join(settings.MODELS_DIR, "cv_resnet18_v1.pt")
    torch.save(model.state_dict(), checkpoint_path)
    print(f"[CV Training] Model checkpoint saved successfully to {checkpoint_path}\n")

    return {
        "type_accuracy": type_acc,
        "type_f1_macro": type_f1_macro,
        "cond_accuracy": cond_acc,
        "cond_f1_macro": cond_f1_macro,
        "checkpoint_path": checkpoint_path
    }

if __name__ == "__main__":
    train_cv_model(epochs=5)
