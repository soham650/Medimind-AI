import re
from typing import List, Dict, Any, Tuple, Optional
from src.report.schemas import ReportFinding, ExtractedSymptom, NormalizedFinding

# Controlled, clinically validated mapping from finding/symptom phrases to the 132 canonical MediMind symptoms
CLINICAL_SYMPTOM_MAP: Dict[str, str] = {
    # Respiratory & Airway
    "breathlessness": "breathlessness",
    "shortness of breath": "breathlessness",
    "difficulty breathing": "breathlessness",
    "dyspnea": "breathlessness",
    "chest pain": "chest_pain",
    "angina": "chest_pain",
    "chest tightness": "chest_pain",
    "substernal chest pain": "chest_pain",
    "cough": "cough",
    "dry cough": "cough",
    "productive cough": "cough",
    "phlegm": "phlegm",
    "sputum": "phlegm",
    "blood in sputum": "blood_in_sputum",
    "hemoptysis": "blood_in_sputum",
    "runny nose": "runny_nose",
    "rhinorrhea": "runny_nose",
    "continuous sneezing": "continuous_sneezing",
    "sneezing": "continuous_sneezing",
    "throat irritation": "throat_irritation",
    "scratchy throat": "throat_irritation",
    "sore throat": "throat_irritation",
    "sinus pressure": "sinus_pressure",
    "congestion": "congestion",
    "nasal congestion": "congestion",

    # Cutaneous / Dermatological
    "itching": "itching",
    "itchy skin": "itching",
    "pruritus": "itching",
    "skin rash": "skin_rash",
    "cutaneous rash": "skin_rash",
    "erythema": "skin_rash",
    "itchy skin rash": "skin_rash",
    "nodal skin eruptions": "nodal_skin_eruptions",
    "skin peeling": "skin_peeling",
    "blister": "blister",
    "red sore around nose": "red_sore_around_nose",
    "yellow crust ooze": "yellow_crust_ooze",
    "pus filled pimples": "pus_filled_pimples",
    "blackheads": "blackheads",

    # Constitutional & Febrile
    "high fever": "high_fever",
    "fever": "high_fever",
    "pyrexia": "high_fever",
    "mild fever": "mild_fever",
    "low grade fever": "mild_fever",
    "chills": "chills",
    "shivering": "shivering",
    "rigors": "shivering",
    "shivering and chills": "shivering",
    "sweating": "sweating",
    "diaphoresis": "sweating",
    "headache": "headache",
    "cephalalgia": "headache",
    "fatigue": "fatigue",
    "malaise": "malaise",
    "lethargy": "lethargy",
    "asthenia": "fatigue",
    "weakness": "fatigue",

    # Gastrointestinal & Hepatic
    "stomach pain": "stomach_pain",
    "abdominal pain": "abdominal_pain",
    "belly pain": "belly_pain",
    "nausea": "nausea",
    "vomiting": "vomiting",
    "emesis": "vomiting",
    "diarrhoea": "diarrhoea",
    "diarrhea": "diarrhoea",
    "loose stools": "diarrhoea",
    "constipation": "constipation",
    "acidity": "acidity",
    "indigestion": "indigestion",
    "loss of appetite": "loss_of_appetite",
    "anorexia": "loss_of_appetite",
    "yellowish skin": "yellowish_skin",
    "yellowing of eyes": "yellowing_of_eyes",
    "jaundice": "yellowish_skin",
    "icterus": "yellowish_skin",
    "dark urine": "dark_urine",
    "stomach bleeding": "stomach_bleeding",
    "bloody stool": "bloody_stool",

    # Musculoskeletal & Neurological
    "joint pain": "joint_pain",
    "arthralgia": "joint_pain",
    "muscle pain": "muscle_pain",
    "myalgia": "muscle_pain",
    "body aches": "muscle_pain",
    "neck pain": "neck_pain",
    "stiff neck": "stiff_neck",
    "dizziness": "dizziness",
    "loss of balance": "loss_of_balance",
    "unsteadiness": "unsteadiness",
    "weakness of one body side": "weakness_of_one_body_side",
    "slurred speech": "slurred_speech",
    "altered sensorium": "altered_sensorium",
    "confusion": "altered_sensorium",
    "coma": "coma",
    "palpitations": "palpitations",
    "fast heart rate": "fast_heart_rate",
    "tachycardia": "fast_heart_rate"
}

class FindingNormalizer:
    """
    Normalizes extracted clinical findings and applies strictly controlled mapping
    to MediMind's canonical 132 symptom features.
    """
    @staticmethod
    def clean_string(s: str) -> str:
        s = s.lower().strip()
        s = re.sub(r'[\s_]+', ' ', s)
        s = re.sub(r'[^\w\s]', '', s)
        return s.strip()

    def normalize_findings(
        self,
        findings: List[ReportFinding],
        symptoms: List[ExtractedSymptom]
    ) -> Tuple[List[NormalizedFinding], List[str]]:
        """
        Processes findings and symptoms.
        Returns:
            normalized_findings: List[NormalizedFinding]
            mapped_symptoms: List[str] of deduplicated 132 MediMind symptoms
        """
        normalized_records: List[NormalizedFinding] = []
        mapped_symptoms_set = set()

        # 1. Process structured lab findings (do NOT blindly convert numeric labs to symptoms)
        for f in findings:
            cleaned_name = self.clean_string(f.name)
            # Only map if explicitly defined in controlled clinical map
            mapped = CLINICAL_SYMPTOM_MAP.get(cleaned_name)
            
            is_compat = False
            if mapped:
                is_compat = True
                mapped_symptoms_set.add(mapped)

            normalized_records.append(NormalizedFinding(
                original_name=f.name,
                canonical_name=cleaned_name.title(),
                mapped_symptom=mapped,
                status=f.status.lower() if f.status else "normal",
                is_symptom_compatible=is_compat
            ))

        # 2. Process clinical symptoms explicitly noted in the report
        for s in symptoms:
            cleaned_name = self.clean_string(s.name)
            mapped = CLINICAL_SYMPTOM_MAP.get(cleaned_name)
            if not mapped:
                # Try partial word match in clinical symptom map keys
                for key, canonical in CLINICAL_SYMPTOM_MAP.items():
                    if key in cleaned_name or cleaned_name in key:
                        mapped = canonical
                        break

            if mapped:
                mapped_symptoms_set.add(mapped)

            normalized_records.append(NormalizedFinding(
                original_name=s.name,
                canonical_name=cleaned_name.title(),
                mapped_symptom=mapped,
                status="abnormal" if s.severity in ["moderate", "severe"] else "reported",
                is_symptom_compatible=bool(mapped)
            ))

        return normalized_records, sorted(list(mapped_symptoms_set))
