# WatershedVision-AI Machine Learning Evaluation Results & Provenance

## Dataset Provenance and Disclosure Note

> **Important Disclosure Regarding Dataset Origin**:
> The computer vision training and evaluation dataset utilized in `backend/ml/cv_model/train_cv.py` is **synthetically generated** via `backend/ml/cv_model/bootstrap_dataset.py`. It uses procedural geometric patterns, colored backgrounds, and synthetic damage overlays to simulate structure categories and physical condition states. **It is NOT composed of real field photographs.**
>
> Similarly, the time-series feature dataset for the XGBoost structural failure forecast model (`backend/ml/forecast_model/train_forecast.py`) employs programmatic observation generation and heuristic weak supervision (`backend/ml/forecast_model/bootstrap_labels.py`) rather than ground-truth physical sensor telemetry.

---

## Evaluation Artifacts

This directory contains evaluation visualizations generated on proper held-out validation splits:

1. **`cm_structure_type.png`**: Confusion matrix for the multi-task ResNet18 structure-type classification head (Check Dam, Farm Pond, Bund, Contour Trench, Earthen Dam, Other).
2. **`cm_condition.png`**: Confusion matrix for the ResNet18 condition assessment head (Functional, Minor Damage, Major Damage, Non-Functional).
3. **`xgboost_feature_importance.png`**: Ranked feature importance bar chart for the XGBoost risk forecasting model, highlighting the top predictive features (e.g. condition scores, NDVI/NDWI trends, precipitation variability, structure age).

---

## Validation Protocol

- **Dual-Head ResNet-18**: Evaluated on a held-out 20% validation split ($N=32$ samples) with data augmentation restricted to the training subset.
- **XGBoost Failure Risk Classifier**: Evaluated on a stratified held-out 25% test split ($N=24$ samples).
