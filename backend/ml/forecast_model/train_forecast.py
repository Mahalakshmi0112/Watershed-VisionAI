import os
from pathlib import Path
import random
import datetime
import numpy as np
import pandas as pd
import xgboost as xgb
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)
from backend.ml.forecast_model.feature_engineering import extract_forecast_features_for_structure
from backend.ml.forecast_model.bootstrap_labels import generate_weak_supervision_label
from backend.config.settings import settings

def train_forecast_model():
    print("=" * 70)
    print("[Forecast Training] DATASET & WEAK SUPERVISION NOTICE:")
    print("  * Training features derived from synthetic/bootstrapped time series.")
    print("  * Ground-truth labels generated via weak supervision rules in bootstrap_labels.py.")
    print("=" * 70)
    print("[Forecast Training] Generating time-series structure feature dataset...")
    random.seed(42)
    now = datetime.datetime.utcnow()

    dataset_features = []
    dataset_targets = []
    synthetic_excluded_count = 0

    # Generate synthetic training structure scenarios (some with real obs, some with synthetic obs)
    for i in range(120):
        # 80% real observations, 20% synthetic observations
        is_synth = (i % 5 == 0)
        source_flag = "synthetic" if is_synth else "real"
        
        struct_data = {
            "latitude": 19.0 + (i * 0.01),
            "longitude": 73.0 + (i * 0.01),
            "construction_year": 2015 + (i % 8)
        }

        # Create observation time series
        num_obs = 6 if not is_synth else 2  # synthetic structures have fewer real points
        obs_list = []
        for j in range(num_obs):
            obs_date = now - datetime.timedelta(days=(5 - j) * 30)
            # Declining trend for degrading structures
            if i % 3 == 0:
                ndvi = max(0.1, 0.50 - (j * 0.05))
                ndwi = max(-0.1, 0.25 - (j * 0.04))
                c_score = 40.0 + (j * 8.0)
            else:
                ndvi = 0.45 + (j * 0.01)
                ndwi = 0.20 + (j * 0.01)
                c_score = 15.0

            obs_list.append({
                "observation_date": obs_date,
                "ndvi": round(ndvi, 3),
                "ndwi": round(ndwi, 3),
                "data_source": source_flag
            })

        # Feature extraction with observation-level filtering
        feats = extract_forecast_features_for_structure(struct_data, obs_list, condition_score=c_score)
        
        if feats is None:
            synthetic_excluded_count += 1
            continue

        label = generate_weak_supervision_label(feats)
        dataset_features.append(feats)
        dataset_targets.append(label)

    print(f"[Forecast Training] Dataset ready. Samples included: {len(dataset_features)}, Excluded (due to synthetic/insufficient real obs): {synthetic_excluded_count}")

    X = pd.DataFrame(dataset_features)
    y = np.array(dataset_targets)

    # Held-out 25% test split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    # Train XGBoost Classifier
    model = xgb.XGBClassifier(
        n_estimators=60,
        max_depth=4,
        learning_rate=0.05,
        random_state=42,
        eval_metric="logloss"
    )
    model.fit(X_train, y_train)

    # Predictions & Metrics on held-out test split
    y_preds = model.predict(X_test)
    y_probs = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_preds)
    prec_binary = precision_score(y_test, y_preds, average="binary", zero_division=0)
    rec_binary = recall_score(y_test, y_preds, average="binary", zero_division=0)
    f1_bin = f1_score(y_test, y_preds, average="binary", zero_division=0)
    f1_macro = f1_score(y_test, y_preds, average="macro", zero_division=0)
    roc_auc = roc_auc_score(y_test, y_probs)

    print("\n" + "=" * 70)
    print(f"XGBOOST FORECAST MODEL EVALUATION RESULTS (HELD-OUT TEST SET, N = {len(y_test)})")
    print("NOTE: Trained with weak supervision labels (bootstrap_labels.py)")
    print("=" * 70)
    print(f"  Accuracy:              {acc:.4f} ({acc*100:.2f}%)")
    print(f"  At-Risk Precision:     {prec_binary:.4f}")
    print(f"  At-Risk Recall:        {rec_binary:.4f}")
    print(f"  At-Risk F1-Score:      {f1_bin:.4f}")
    print(f"  Macro-Averaged F1:     {f1_macro:.4f}")
    print(f"  ROC-AUC:               {roc_auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_preds, target_names=["Healthy", "At Risk"], zero_division=0))

    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_preds))

    # --- Feature Importances ---
    importance_dict = dict(zip(X.columns, model.feature_importances_))
    sorted_importances = sorted(importance_dict.items(), key=lambda item: item[1], reverse=True)

    print("\n" + "-" * 50)
    print("XGBOOST FEATURE IMPORTANCES (Ranked):")
    print("-" * 50)
    for rank, (feat_name, imp_val) in enumerate(sorted_importances, 1):
        print(f"  {rank:2d}. {feat_name:<28} : {imp_val:.5f} ({imp_val*100:.2f}%)")

    # --- Save Feature Importance Plot ---
    results_dirs = [
        Path(__file__).resolve().parent.parent.parent.parent / "results",
        Path(__file__).resolve().parent.parent / "results"
    ]
    for r_dir in results_dirs:
        r_dir.mkdir(parents=True, exist_ok=True)

    # Plot top features
    top_n = min(10, len(sorted_importances))
    top_features = sorted_importances[:top_n]
    feat_names = [x[0] for x in top_features][::-1]
    feat_scores = [x[1] for x in top_features][::-1]

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.barh(feat_names, feat_scores, color="#0284c7", edgecolor="#0369a1", height=0.6)
    ax.set_xlabel("Feature Importance (Gini / Gain Score)", fontsize=10, fontweight="bold")
    ax.set_title(f"Top {top_n} XGBoost Forecast Model Features\n(Failure Risk Classification)", fontsize=12, fontweight="bold")
    ax.grid(axis="x", linestyle="--", alpha=0.6)

    # Add numeric labels to bars
    for bar in bars:
        width = bar.get_width()
        ax.text(width + 0.005, bar.get_y() + bar.get_height()/2, f"{width:.3f}",
                va="center", ha="left", fontsize=9, color="#1e293b", fontweight="semibold")

    plt.tight_layout()
    for r_dir in results_dirs:
        fig.savefig(r_dir / "xgboost_feature_importance.png", dpi=200)
    plt.close(fig)

    print(f"\n[Plot Saved] Feature importance plot saved to results/xgboost_feature_importance.png")

    # Save Model Artifact
    checkpoint_path = os.path.join(settings.MODELS_DIR, "forecast_xgb_v1.json")
    model.save_model(checkpoint_path)
    print(f"[Forecast Training] Model artifact saved to {checkpoint_path}\n")

    return {
        "accuracy": acc,
        "f1_score": f1_bin,
        "f1_macro": f1_macro,
        "roc_auc": roc_auc,
        "feature_importances": sorted_importances,
        "checkpoint_path": checkpoint_path
    }

if __name__ == "__main__":
    train_forecast_model()
