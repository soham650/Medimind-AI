import os
import pandas as pd
from typing import List, Dict, Any, Optional
from src.config import SYMPTOM_SEVERITY_CSV, RED_FLAG_SYMPTOMS

class IndependentRiskEngine:
    """
    Independent Clinical Risk Assessment Engine.
    Decoupled from ML model classification confidence.
    Assesses triage priority based on symptom severity indices, red-flag alarms,
    and optional physiological vitals.
    """
    def __init__(self, severity_file: str = SYMPTOM_SEVERITY_CSV):
        self.severity_file = severity_file
        self.severity_weights: Dict[str, int] = {}
        self._load_severity_weights()

    def _load_severity_weights(self):
        if os.path.exists(self.severity_file):
            try:
                df = pd.read_csv(self.severity_file)
                for _, row in df.iterrows():
                    sym = str(row['Symptom']).strip().lower()
                    try:
                        w = int(row['weight'])
                        self.severity_weights[sym] = w
                    except (ValueError, TypeError):
                        continue
            except Exception as e:
                print(f"[RiskEngine] Warning: Could not read severity weights: {e}")

    def evaluate_risk(
        self,
        symptoms: List[str],
        vitals: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates independent clinical risk.
        Returns:
            triage_level: 'Emergency' | 'High / Urgent' | 'Moderate' | 'Low'
            severity_score: Total composite severity score
            is_emergency: Boolean flag
            red_flags_present: List of identified critical red flags
            triage_timeframe: Actionable medical time horizon
            recommendation: Clinical advisory
        """
        clean_symptoms = [s.strip().lower() for s in symptoms if isinstance(s, str)]
        
        # 1. Identify Red Flags
        identified_red_flags = []
        for s in clean_symptoms:
            # check exact or substring match in red-flag symptoms
            for rf in RED_FLAG_SYMPTOMS:
                if rf == s or rf in s:
                    if rf not in identified_red_flags:
                        identified_red_flags.append(rf)

        # 2. Compute Symptom Severity Score
        total_score = 0
        scored_symptoms = {}
        for s in clean_symptoms:
            weight = self.severity_weights.get(s, self.severity_weights.get(s.replace(" ", "_"), 3))
            scored_symptoms[s] = weight
            total_score += weight

        # 3. Check Vitals Risk if provided
        vitals_risk_flags = []
        if vitals:
            bp_sys = vitals.get("bp_systolic")
            bp_dia = vitals.get("bp_diastolic")
            blood_sugar = vitals.get("blood_sugar")
            
            if bp_sys and (bp_sys >= 180 or bp_sys <= 85):
                vitals_risk_flags.append(f"Critical Blood Pressure: {bp_sys} mmHg systolic")
            elif bp_sys and bp_sys >= 140:
                vitals_risk_flags.append(f"Elevated Blood Pressure: {bp_sys} mmHg systolic")

            if bp_dia and (bp_dia >= 120 or bp_dia <= 50):
                vitals_risk_flags.append(f"Critical Diastolic BP: {bp_dia} mmHg")

            if blood_sugar and (blood_sugar >= 250 or blood_sugar <= 60):
                vitals_risk_flags.append(f"Dangerous Blood Glucose: {blood_sugar} mg/dL")

        # 4. Determine Independent Triage Tier
        if len(identified_red_flags) >= 2 or any(rf in ["coma", "altered_sensorium", "acute_liver_failure", "stomach_bleeding"] for rf in identified_red_flags):
            triage_level = "Emergency"
            is_emergency = True
            timeframe = "Immediate emergency medical attention required (Call Emergency Services / ER)"
            recommendation = (
                f"Critical red-flag symptoms detected ({', '.join(identified_red_flags)}). "
                "Do not wait for an outpatient appointment. Proceed to the nearest emergency department immediately."
            )
        elif len(identified_red_flags) >= 1 or total_score >= 25 or len(vitals_risk_flags) >= 1:
            triage_level = "High / Urgent"
            is_emergency = True if "chest_pain" in identified_red_flags or "breathlessness" in identified_red_flags else False
            timeframe = "Clinical evaluation recommended within 6 to 12 hours"
            flags = identified_red_flags + vitals_risk_flags
            recommendation = (
                f"Significant symptom burden or red flag noted ({', '.join(flags)}). "
                "Urgent medical consultation is advised."
            )
        elif total_score >= 12 or len(clean_symptoms) >= 4:
            triage_level = "Moderate"
            is_emergency = False
            timeframe = "Consult a physician within 24 to 48 hours"
            recommendation = (
                "Symptoms indicate active physiological response. Schedule a routine clinical checkup. "
                "Monitor for fever, worsening fatigue, or progressive discomfort."
            )
        else:
            triage_level = "Low"
            is_emergency = False
            timeframe = "Routine home care and monitoring"
            recommendation = (
                "Mild localized symptom profile. Practice hydration, rest, and appropriate non-medicinal precautions. "
                "Consult a doctor if symptoms persist beyond 3 to 5 days."
            )

        return {
            "triage_level": triage_level,
            "severity_score": total_score,
            "is_emergency": is_emergency,
            "red_flags": identified_red_flags,
            "vitals_warnings": vitals_risk_flags,
            "triage_timeframe": timeframe,
            "clinical_recommendation": recommendation
        }
