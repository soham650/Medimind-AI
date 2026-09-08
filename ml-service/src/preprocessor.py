import json
import os
import re
import numpy as np
from typing import List, Tuple, Dict
from src.config import SYMPTOMS_JSON_PATH

class SymptomPreprocessor:
    def __init__(self, symptoms_file: str = SYMPTOMS_JSON_PATH):
        self.symptoms_file = symptoms_file
        self.symptoms_list: List[str] = []
        self.symptom_to_idx: Dict[str, int] = {}
        self.alias_map: Dict[str, str] = {}
        self._load_symptoms()

    def _load_symptoms(self):
        if os.path.exists(self.symptoms_file):
            with open(self.symptoms_file, "r") as f:
                self.symptoms_list = json.load(f)
        else:
            self.symptoms_list = []

        self.symptom_to_idx = {sym: idx for idx, sym in enumerate(self.symptoms_list)}
        
        # Build normalized alias lookup map
        for sym in self.symptoms_list:
            norm_key = self.normalize_symptom_key(sym)
            self.alias_map[norm_key] = sym
            
        # Common user-friendly synonyms and clean mappings
        custom_synonyms = {
            "spotting_urination": "spotting_ urination",
            "spotting urination": "spotting_ urination",
            "foul_smell_of_urine": "foul_smell_of urine",
            "foul smell of urine": "foul_smell_of urine",
            "dischromic_patches": "dischromic _patches",
            "dischromic patches": "dischromic _patches",
            "toxic_look": "toxic_look_(typhos)",
            "toxic look": "toxic_look_(typhos)",
            "fever": "high_fever",
            "stomachache": "stomach_pain",
            "bellyache": "belly_pain",
            "shortness_of_breath": "breathlessness",
            "difficulty_breathing": "breathlessness",
            "rapid_heartbeat": "fast_heart_rate",
            "throwing_up": "vomiting",
            "loose_motion": "diarrhoea",
            "diarrhea": "diarrhoea",
            "dizzy": "dizziness",
            "tired": "fatigue",
            "exhaustion": "fatigue"
        }
        for syn, target in custom_synonyms.items():
            if target in self.symptom_to_idx:
                self.alias_map[self.normalize_symptom_key(syn)] = target

    @staticmethod
    def normalize_symptom_key(s: str) -> str:
        """Strip punctuation, excessive whitespaces, and lowercase."""
        s = s.lower().strip()
        s = re.sub(r'[\s_]+', '_', s)
        s = re.sub(r'[^\w]', '', s)
        return s

    def vectorize_symptoms(self, symptoms: List[str]) -> Tuple[np.ndarray, List[str], List[str]]:
        """
        Transforms a list of user-provided symptom names into a 132-dim binary numpy vector.
        Returns:
            vector: np.ndarray of shape (1, num_features)
            matched_symptoms: list of canonical matched symptoms
            unmatched_symptoms: list of unrecognized inputs
        """
        if not self.symptoms_list:
            self._load_symptoms()

        vector = np.zeros((1, len(self.symptoms_list)), dtype=int)
        matched = []
        unmatched = []

        for item in symptoms:
            if not isinstance(item, str) or not item.strip():
                continue
            
            raw_clean = item.strip()
            norm_key = self.normalize_symptom_key(raw_clean)
            
            # 1. Exact match in symptoms list
            if raw_clean in self.symptom_to_idx:
                idx = self.symptom_to_idx[raw_clean]
                vector[0, idx] = 1
                matched.append(raw_clean)
            # 2. Match via alias map
            elif norm_key in self.alias_map:
                canonical = self.alias_map[norm_key]
                idx = self.symptom_to_idx[canonical]
                vector[0, idx] = 1
                matched.append(canonical)
            else:
                unmatched.append(raw_clean)

        # Handle fluid_overload duplicate column index if present
        if "fluid_overload.1" in self.symptom_to_idx:
            idx1 = self.symptom_to_idx.get("fluid_overload")
            idx2 = self.symptom_to_idx["fluid_overload.1"]
            if idx1 is not None and vector[0, idx1] == 1:
                vector[0, idx2] = 1

        return vector, matched, unmatched
