import os
import json
import joblib
import pickle
import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report
)

from src.config import (
    MODEL_VERSION,
    TRAINING_CSV,
    TESTING_CSV,
    DESCRIPTION_CSV,
    PRECAUTIONS_CSV,
    MODELS_DIR,
    MODEL_JOBLIB_PATH,
    MODEL_PKL_PATH,
    SYMPTOMS_JSON_PATH,
    CLASSES_JSON_PATH,
    DISEASE_INFO_JSON_PATH,
    SPECIALIST_MAPPING
)

def build_disease_info_metadata(classes_list):
    """
    Builds disease descriptions, non-medical precautions, and specialist routing.
    Strictly excludes autonomous medication recommendations.
    """
    disease_info = {}
    
    # 1. Load descriptions
    desc_map = {}
    if os.path.exists(DESCRIPTION_CSV):
        df_desc = pd.read_csv(DESCRIPTION_CSV)
        for _, row in df_desc.iterrows():
            d_name = str(row['Disease']).strip()
            desc = str(row['Description']).strip()
            desc_map[d_name.lower()] = desc

    # 2. Load precautions
    prec_map = {}
    if os.path.exists(PRECAUTIONS_CSV):
        df_prec = pd.read_csv(PRECAUTIONS_CSV)
        for _, row in df_prec.iterrows():
            d_name = str(row['Disease']).strip()
            precs = []
            for col in ['Precaution_1', 'Precaution_2', 'Precaution_3', 'Precaution_4']:
                if col in row and pd.notna(row[col]) and str(row[col]).strip():
                    precs.append(str(row[col]).strip().capitalize())
            prec_map[d_name.lower()] = precs

    for c in classes_list:
        clean_c = c.strip()
        lower_c = clean_c.lower()

        # Handle known slight spelling differences
        aliases = [lower_c]
        if "diseae" in lower_c:
            aliases.append(lower_c.replace("diseae", "disease"))
        if "(vertigo)" in lower_c:
            aliases.append("(vertigo) paroymsal positional vertigo")
            aliases.append("paroymsal positional vertigo")

        desc = "Clinical profile recognized in dataset."
        for a in aliases:
            if a in desc_map:
                desc = desc_map[a]
                break

        precs = [
            "Consult a qualified healthcare provider",
            "Monitor symptoms closely",
            "Maintain proper rest and hydration"
        ]
        for a in aliases:
            if a in prec_map and prec_map[a]:
                precs = prec_map[a]
                break

        specialist = SPECIALIST_MAPPING.get(clean_c, "General Physician")

        disease_info[clean_c] = {
            "disease": clean_c,
            "description": desc,
            "precautions": precs,
            "specialist": specialist
        }

    return disease_info

def train_and_evaluate():
    print("=" * 70)
    print(f"MediMind Disease Prediction Training Pipeline [{MODEL_VERSION}]")
    print("=" * 70)

    # 1. Load Training Data
    if not os.path.exists(TRAINING_CSV):
        raise FileNotFoundError(f"Training dataset not found at {TRAINING_CSV}")

    print(f"Loading training data from: {TRAINING_CSV}")
    train_df = pd.read_csv(TRAINING_CSV)

    # Handle unnamed columns if any
    unnamed_cols = [c for c in train_df.columns if c.startswith("Unnamed")]
    if unnamed_cols:
        train_df = train_df.drop(columns=unnamed_cols)

    # Clean targets
    train_df['prognosis'] = train_df['prognosis'].astype(str).str.strip()
    
    # Feature columns (132 symptom columns)
    symptom_cols = [c for c in train_df.columns if c != 'prognosis']
    print(f"Total training samples: {len(train_df)}")
    print(f"Number of symptom features: {len(symptom_cols)}")
    
    classes_list = sorted(list(train_df['prognosis'].unique()))
    print(f"Number of unique condition classes: {len(classes_list)}")

    X_train = train_df[symptom_cols].values
    y_train = train_df['prognosis'].values

    # 2. 5-Fold Stratified Cross-Validation ON TRAINING DATA ONLY
    print("\n--- Running 5-Fold Stratified Cross-Validation on Training.csv ---")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    
    cv_scores = cross_val_score(cv_model, X_train, y_train, cv=skf, scoring='accuracy')
    cv_mean = float(np.mean(cv_scores))
    cv_std = float(np.std(cv_scores))
    print(f"5-Fold CV Accuracy: {cv_mean:.4f} (+/- {cv_std:.4f})")
    print(f"Individual Fold Accuracies: {[round(s, 4) for s in cv_scores]}")

    # 3. Train Final Model on full Training.csv
    print(f"\n--- Training Final Model ({MODEL_VERSION}) on full Training.csv ---")
    final_model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        max_depth=None,
        min_samples_split=2,
        class_weight='balanced',
        n_jobs=-1
    )
    final_model.fit(X_train, y_train)

    # 4. Final Evaluation on Held-Out Testing.csv ONLY
    if not os.path.exists(TESTING_CSV):
        raise FileNotFoundError(f"Testing dataset not found at {TESTING_CSV}")

    print(f"\n--- Evaluating on Held-Out Testing.csv ({TESTING_CSV}) ---")
    test_df = pd.read_csv(TESTING_CSV)
    
    # Clean unnamed columns
    test_unnamed = [c for c in test_df.columns if c.startswith("Unnamed")]
    if test_unnamed:
        test_df = test_df.drop(columns=test_unnamed)

    test_df['prognosis'] = test_df['prognosis'].astype(str).str.strip()

    X_test = test_df[symptom_cols].values
    y_test = test_df['prognosis'].values

    y_pred = final_model.predict(X_test)

    # Actual metrics calculation
    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average='macro', zero_division=0))
    rec_macro = float(recall_score(y_test, y_pred, average='macro', zero_division=0))
    f1_macro = float(f1_score(y_test, y_pred, average='macro', zero_division=0))

    prec_weighted = float(precision_score(y_test, y_pred, average='weighted', zero_division=0))
    rec_weighted = float(recall_score(y_test, y_pred, average='weighted', zero_division=0))
    f1_weighted = float(f1_score(y_test, y_pred, average='weighted', zero_division=0))

    print(f"Held-Out Testing Samples: {len(test_df)}")
    print(f"Testing Accuracy:           {acc:.4f} ({acc*100:.2f}%)")
    print(f"Precision (Macro):         {prec_macro:.4f}")
    print(f"Recall (Macro):            {rec_macro:.4f}")
    print(f"F1 Score (Macro):          {f1_macro:.4f}")
    print(f"Precision (Weighted):      {prec_weighted:.4f}")
    print(f"Recall (Weighted):         {rec_weighted:.4f}")
    print(f"F1 Score (Weighted):       {f1_weighted:.4f}")

    print("\nDetailed Classification Report:")
    print(classification_report(y_test, y_pred, zero_division=0))

    # 5. Export Model Artifacts
    os.makedirs(MODELS_DIR, exist_ok=True)

    print(f"\n--- Saving Artifacts in {MODELS_DIR} ---")
    joblib.dump(final_model, MODEL_JOBLIB_PATH)
    print(f"Saved: {MODEL_JOBLIB_PATH}")

    with open(MODEL_PKL_PATH, "wb") as f:
        pickle.dump(final_model, f)
    print(f"Saved: {MODEL_PKL_PATH}")

    with open(SYMPTOMS_JSON_PATH, "w") as f:
        json.dump(symptom_cols, f, indent=2)
    print(f"Saved: {SYMPTOMS_JSON_PATH} ({len(symptom_cols)} features)")

    with open(CLASSES_JSON_PATH, "w") as f:
        json.dump(classes_list, f, indent=2)
    print(f"Saved: {CLASSES_JSON_PATH} ({len(classes_list)} classes)")

    disease_info = build_disease_info_metadata(classes_list)
    with open(DISEASE_INFO_JSON_PATH, "w") as f:
        json.dump(disease_info, f, indent=2)
    print(f"Saved: {DISEASE_INFO_JSON_PATH} ({len(disease_info)} condition profiles)")

    print("\n" + "=" * 70)
    print("Training and Artifact Export Successfully Completed.")
    print("=" * 70)

    return {
        "model_version": MODEL_VERSION,
        "features_count": len(symptom_cols),
        "classes_count": len(classes_list),
        "cv_accuracy_mean": cv_mean,
        "cv_accuracy_std": cv_std,
        "test_accuracy": acc,
        "precision_macro": prec_macro,
        "recall_macro": rec_macro,
        "f1_macro": f1_macro,
        "precision_weighted": prec_weighted,
        "recall_weighted": rec_weighted,
        "f1_weighted": f1_weighted
    }

if __name__ == "__main__":
    train_and_evaluate()
