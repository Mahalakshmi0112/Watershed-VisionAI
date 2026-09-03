import os
import random
import datetime
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, precision_recall_fscore_support, roc_auc_score
from backend.ml.forecast_model.feature_engineering import extract_forecast_features_for_structure
from backend.ml.forecast_model.bootstrap_labels import generate_weak_supervision_label
from backend.config.settings import settings

def train_forecast_model():
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

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    # Train XGBoost Classifier
    model = xgb.XGBClassifier(
        n_estimators=50,
        max_depth=4,
        learning_rate=0.05,
        random_state=42,
        eval_metric="logloss"
    )
    model.fit(X_train, y_train)

    # Predictions & Metrics
    y_preds = model.predict(X_test)
    y_probs = model.predict_proba(X_test)[:, 1]

    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_preds, average="binary")
    roc_auc = roc_auc_score(y_test, y_probs)

    print("\n--- Forecast Model Evaluation Results ---")
    print(f"At-Risk Class Precision: {precision:.4f}")
    print(f"At-Risk Class Recall: {recall:.4f}")
    print(f"F1-Score: {f1:.4f}")
    print(f"ROC-AUC: {roc_auc:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_preds, target_names=["Healthy", "At Risk"]))

    # Save Model Artifact
    checkpoint_path = os.path.join(settings.MODELS_DIR, "forecast_xgb_v1.json")
    model.save_model(checkpoint_path)
    print(f"[Forecast Training] Model artifact saved to {checkpoint_path}")
    return checkpoint_path

if __name__ == "__main__":
    train_forecast_model()
