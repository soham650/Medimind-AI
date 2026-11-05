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
            # UI Quick Badges and labels
            "headache / forehead pain": "headache",
            "headache_forehead_pain": "headache",
            "forehead pain": "headache",
            "forehead_pain": "headache",
            "head ache": "headache",
            "fever & warmth": "high_fever",
            "fever_warmth": "high_fever",
            "warmth": "high_fever",
            "high temperature": "high_fever",
            "high_fever": "high_fever",
            "mild_fever": "mild_fever",
            "mild fever": "mild_fever",
            "fever": "high_fever",
            "cough & sneezing": "cough",
            "cough_sneezing": "cough",
            "coughing": "cough",
            "sneezing": "continuous_sneezing",
            "cold": "continuous_sneezing",
            "common cold": "continuous_sneezing",
            "upset stomach / nausea": "stomach_pain",
            "upset_stomach_nausea": "stomach_pain",
            "upset stomach": "stomach_pain",
            "upset_stomach": "stomach_pain",
            "stomachache": "stomach_pain",
            "stomach ache": "stomach_pain",
            "stomach pain": "stomach_pain",
            "bellyache": "belly_pain",
            "belly ache": "belly_pain",
            "belly pain": "belly_pain",
            "tiredness & low energy": "fatigue",
            "tiredness_low_energy": "fatigue",
            "tiredness": "fatigue",
            "low energy": "fatigue",
            "low_energy": "fatigue",
            "scratchy throat": "throat_irritation",
            "scratchy_throat": "throat_irritation",
            "sore throat": "throat_irritation",
            "sore_throat": "throat_irritation",
            "throat pain": "throat_irritation",
            "throat irritation": "throat_irritation",
            "light sensitivity": "blurred_and_distorted_vision",
            "light_sensitivity": "blurred_and_distorted_vision",
            "sensitive to light": "blurred_and_distorted_vision",
            "ear discomfort": "sinus_pressure",
            "ear_discomfort": "sinus_pressure",
            "ear pain": "sinus_pressure",
            "ear ache": "sinus_pressure",
            # Additional common terms
            "spotting_urination": "spotting_ urination",
            "spotting urination": "spotting_ urination",
            "foul_smell_of_urine": "foul_smell_of urine",
            "foul smell of urine": "foul_smell_of urine",
            "dischromic_patches": "dischromic _patches",
            "dischromic patches": "dischromic _patches",
            "toxic_look": "toxic_look_(typhos)",
            "toxic look": "toxic_look_(typhos)",
            "shortness_of_breath": "breathlessness",
            "shortness of breath": "breathlessness",
            "difficulty_breathing": "breathlessness",
            "difficulty breathing": "breathlessness",
            "rapid_heartbeat": "fast_heart_rate",
            "rapid heartbeat": "fast_heart_rate",
            "throwing_up": "vomiting",
            "throwing up": "vomiting",
            "vomit": "vomiting",
            "vomits": "vomiting",
            "loose_motion": "diarrhoea",
            "loose motion": "diarrhoea",
            "loose motions": "diarrhoea",
            "diarrhea": "diarrhoea",
            "dizzy": "dizziness",
            "tired": "fatigue",
            "exhaustion": "fatigue",
            "not_feeling_well": "malaise",
            "not feeling well": "malaise",
            "feeling_unwell": "malaise",
            "unwell": "malaise",
            "body_ache": "muscle_pain",
            "body ache": "muscle_pain",
            "body pain": "muscle_pain",
            "joint pain": "joint_pain",
            "joint ache": "joint_pain",
            "chest pain": "chest_pain",
            "runny nose": "runny_nose",
            "sinus": "sinus_pressure",
            "gas": "passage_of_gases",
            "bloating": "distention_of_abdomen",
            "weakness": "muscle_weakness"
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
            item_matched = False
            
            # 1. Exact match in symptoms list
            if raw_clean in self.symptom_to_idx:
                idx = self.symptom_to_idx[raw_clean]
                vector[0, idx] = 1
                if raw_clean not in matched:
                    matched.append(raw_clean)
                item_matched = True
            # 2. Match via alias map
            elif norm_key in self.alias_map:
                canonical = self.alias_map[norm_key]
                idx = self.symptom_to_idx[canonical]
                vector[0, idx] = 1
                if canonical not in matched:
                    matched.append(canonical)
                item_matched = True
            else:
                # 3. Substring & sub-token scanning for compound/badge inputs
                # Check if known alias or canonical symptom is contained within norm_key
                sub_matched = False
                for alias_k, canonical in self.alias_map.items():
                    if len(alias_k) >= 4 and (alias_k in norm_key or norm_key in alias_k):
                        idx = self.symptom_to_idx[canonical]
                        vector[0, idx] = 1
                        if canonical not in matched:
                            matched.append(canonical)
                        sub_matched = True
                
                # If still not matched, split into words and check individual words
                if not sub_matched:
                    words = re.split(r'[\s_/,;&]+', raw_clean.lower())
                    for word in words:
                        word_key = self.normalize_symptom_key(word)
                        if word_key in self.alias_map:
                            canonical = self.alias_map[word_key]
                            idx = self.symptom_to_idx[canonical]
                            vector[0, idx] = 1
                            if canonical not in matched:
                                matched.append(canonical)
                            sub_matched = True
                
                if sub_matched:
                    item_matched = True
                else:
                    unmatched.append(raw_clean)

        # Handle fluid_overload duplicate column index if present
        if "fluid_overload.1" in self.symptom_to_idx:
            idx1 = self.symptom_to_idx.get("fluid_overload")
            idx2 = self.symptom_to_idx["fluid_overload.1"]
            if idx1 is not None and vector[0, idx1] == 1:
                vector[0, idx2] = 1

        return vector, matched, unmatched
