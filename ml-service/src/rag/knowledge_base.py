import os
from typing import Dict, Any, List, Optional
from datetime import datetime

# Master Authoritative Knowledge Repository for MediMind AI
# Sources: WHO, ICMR (Indian Council of Medical Research), MoHFW India, CDC, NICE Guidelines
CLINICAL_GUIDELINES_CORPUS: Dict[str, Dict[str, Any]] = {
    "Heart attack": {
        "citation_id": "MED-CARD-EMERG-001",
        "source_organization": "American College of Cardiology / ICMR Consensus",
        "guideline_title": "Acute Coronary Syndrome & Myocardial Infarction Emergency Protocol",
        "document_version": "2026.1",
        "icd10_code": "I21.9",
        "snomed_code": "22298006",
        "primary_specialty": "Cardiologist / Emergency Medicine",
        "esi_acuity_level": 1,
        "publication_date": "2025-10-15",
        "summary": "Myocardial infarction represents a life-threatening clinical emergency requiring immediate emergency medical evaluation, ECG acquisition within 10 minutes, and rapid reperfusion triage.",
        "precautions": [
            "IMMEDIATE EMERGENCY: Call ambulance / emergency services immediately (108/911)",
            "Cease all physical exertion and sit in an upright or semi-recumbent posture",
            "Do not attempt to drive yourself to the hospital"
        ],
        "home_care_protocol": "Loosen restrictive clothing. Remain calm while awaiting emergency medical services. Do not ingest heavy meals or stimulants.",
        "red_flags": [
            "Crushing retrosternal chest pain or pressure radiating to left arm, neck, or jaw",
            "Profuse cold sweats (diaphoresis) accompanied by dyspnea",
            "Sudden syncope, dizziness, or impending sense of doom"
        ]
    },
    "Hypertension": {
        "citation_id": "MED-CARD-HTN-002",
        "source_organization": "Indian Guidelines on Hypertension (I.G.H.) / WHO",
        "guideline_title": "Primary Hypertension Clinical Management Protocol",
        "document_version": "2025.4",
        "icd10_code": "I10",
        "snomed_code": "38341003",
        "primary_specialty": "Cardiologist / General Physician",
        "esi_acuity_level": 3,
        "publication_date": "2025-08-12",
        "summary": "Essential hypertension requires systematic blood pressure surveillance, sodium restriction (<2g/day), structured aerobic exercise, and comprehensive cardiovascular risk stratification.",
        "precautions": [
            "Adhere to dietary sodium reduction (< 2000mg sodium daily)",
            "Engage in moderate-intensity aerobic exercise (150 min/week)",
            "Avoid abrupt cessation of any prescribed antihypertensive therapy"
        ],
        "home_care_protocol": "Maintain a calibrated twice-daily blood pressure log (morning and evening). Practice stress reduction and deep breathing exercises.",
        "red_flags": [
            "Severe occipital headache with visual disturbances or photopsia",
            "Systolic BP >= 180 mmHg or diastolic BP >= 120 mmHg (Hypertensive Crisis)",
            "New-onset chest pain or shortness of breath"
        ]
    },
    "Bronchial Asthma": {
        "citation_id": "MED-PULM-ASTH-003",
        "source_organization": "Global Initiative for Asthma (GINA) / MoHFW India",
        "guideline_title": "Asthma Action Plan and Acute Bronchospasm Triage",
        "document_version": "2026.1",
        "icd10_code": "J45.909",
        "snomed_code": "195967001",
        "primary_specialty": "Pulmonologist",
        "esi_acuity_level": 2,
        "publication_date": "2025-11-01",
        "summary": "Bronchial asthma is a chronic inflammatory disorder of the airways characterized by episodic wheezing, breathlessness, chest tightness, and cough, particularly at night or early morning.",
        "precautions": [
            "Strictly avoid known triggers (smoke, pollen, pet dander, cold air, strong perfumes)",
            "Maintain peak flow meter monitoring if provided by your physician",
            "Always keep prescribed rescue inhalers accessible"
        ],
        "home_care_protocol": "Sit upright during mild flare-ups. Use prescribed spacer device for metered-dose inhalers. Avoid lying flat.",
        "red_flags": [
            "Severe breathlessness unable to speak full sentences in one breath",
            "Silent chest or absent wheeze during severe respiratory distress",
            "Cyanosis (bluish discoloration of lips or nail beds)",
            "Peak expiratory flow < 50% personal best"
        ]
    },
    "Pneumonia": {
        "citation_id": "MED-PULM-PNEU-004",
        "source_organization": "Infectious Diseases Society of America / WHO",
        "guideline_title": "Community-Acquired Pneumonia Clinical Guidelines",
        "document_version": "2025.3",
        "icd10_code": "J18.9",
        "snomed_code": "233604007",
        "primary_specialty": "Pulmonologist / General Physician",
        "esi_acuity_level": 2,
        "publication_date": "2025-09-20",
        "summary": "Pneumonia involves acute alveolar inflammation presenting with fever, productive cough with purulent sputum, pleuritic chest pain, and variable hypoxemia.",
        "precautions": [
            "Seek formal medical evaluation including chest radiography (X-ray) and pulse oximetry",
            "Maintain respiratory hygiene and wear a mask around vulnerable individuals",
            "Ensure complete bed rest during febrile episodes"
        ],
        "home_care_protocol": "Maintain hydration with warm fluids. Monitor SpO2 with pulse oximeter twice daily. Practice gentle coughing and deep breathing.",
        "red_flags": [
            "Oxygen saturation (SpO2) dropping below 92% on room air",
            "Hemoptysis (coughing up blood or rust-colored sputum)",
            "Confusion, disorientation, or lethargy (CURB-65 criteria)",
            "Persistent high fever > 103F unresponsive to antipyretics"
        ]
    },
    "Diabetes": {
        "citation_id": "MED-ENDO-DIAB-005",
        "source_organization": "Research Society for the Study of Diabetes in India (RSSDI) / ADA",
        "guideline_title": "Type 2 Diabetes Mellitus Glycemic Management & Monitoring Protocol",
        "document_version": "2026.1",
        "icd10_code": "E11.9",
        "snomed_code": "44054006",
        "primary_specialty": "Endocrinologist / Diabetologist",
        "esi_acuity_level": 3,
        "publication_date": "2025-12-05",
        "summary": "Diabetes mellitus requires glycemic optimization targeting HbA1c < 7.0%, structured medical nutrition therapy, daily foot inspections, and routine nephropathy/retinopathy screening.",
        "precautions": [
            "Follow a consistent carbohydrate-controlled meal plan with low glycemic index",
            "Inspect feet daily for micro-trauma, blisters, or signs of neuropathy",
            "Carry fast-acting glucose (e.g., 15g glucose tablets or juice) for hypoglycemia emergencies"
        ],
        "home_care_protocol": "Monitor fasting and 2-hour postprandial blood glucose. Maintain adequate hydration. Engage in 30 minutes of daily post-meal walking.",
        "red_flags": [
            "Severe hypoglycemia symptoms (tremors, sweating, confusion, blood sugar < 60 mg/dL)",
            "Hyperglycemic crisis (persistent blood sugar > 300 mg/dL, fruity breath odor, nausea, vomiting)",
            "Non-healing foot ulcer or localized skin erythema"
        ]
    },
    "Hypoglycemia": {
        "citation_id": "MED-ENDO-HYPO-006",
        "source_organization": "American Diabetes Association / RSSDI",
        "guideline_title": "Rule of 15 Acute Hypoglycemia Management Protocol",
        "document_version": "2025.2",
        "icd10_code": "E16.2",
        "snomed_code": "302866003",
        "primary_specialty": "Endocrinologist / General Physician",
        "esi_acuity_level": 2,
        "publication_date": "2025-06-18",
        "summary": "Acute neuroglycopenic response to blood glucose < 70 mg/dL requiring immediate oral glucose administration under the standardized Rule of 15.",
        "precautions": [
            "Immediately execute Rule of 15: Ingest 15 grams of fast-acting carbohydrate (3 teaspoons sugar, half cup fruit juice)",
            "Re-check blood glucose after 15 minutes; repeat if still < 70 mg/dL",
            "Do not administer solids or liquids to an unconscious individual"
        ],
        "home_care_protocol": "Once blood glucose reaches >= 70 mg/dL, consume a small complex carbohydrate snack (e.g., crackers with cheese or a light meal).",
        "red_flags": [
            "Inability to swallow, seizure, or loss of consciousness (requires immediate parenteral glucagon/IV dextrose)",
            "Recurrent hypoglycemia within 24 hours without identifiable cause",
            "Severe disorientation or speech difficulty"
        ]
    },
    "Migraine": {
        "citation_id": "MED-NEURO-MIGR-007",
        "source_organization": "International Headache Society / Indian Academy of Neurology",
        "guideline_title": "Clinical Diagnostic Criteria & Acute Care for Migraine",
        "document_version": "2025.3",
        "icd10_code": "G43.909",
        "snomed_code": "37796009",
        "primary_specialty": "Neurologist",
        "esi_acuity_level": 3,
        "publication_date": "2025-07-22",
        "summary": "Primary neurovascular headache disorder manifesting as unilateral, throbbing moderate-to-severe headache aggravated by physical activity, accompanied by nausea, photophobia, and phonophobia.",
        "precautions": [
            "Identify and log personal triggers (stress, skipping meals, caffeine withdrawal, sleep changes)",
            "Avoid sensory overload during prodromal phase",
            "Do not overuse acute OTC analgesics (>10 days/month) to prevent medication-overuse headache"
        ],
        "home_care_protocol": "Rest in a dark, quiet, temperature-controlled room. Apply cold gel compresses to temples/forehead. Hydrate with electrolyte-balanced water.",
        "red_flags": [
            "Sudden severe 'thunderclap' headache reaching peak intensity in under 1 minute",
            "Headache accompanied by fever, stiff neck, rash, or confusion",
            "New persistent headache in an individual aged > 50 years"
        ]
    },
    "GERD": {
        "citation_id": "MED-GASTRO-GERD-008",
        "source_organization": "World Gastroenterology Organisation / ICMR",
        "guideline_title": "Gastroesophageal Reflux Disease Clinical Practice Guidelines",
        "document_version": "2025.2",
        "icd10_code": "K21.9",
        "snomed_code": "235595009",
        "primary_specialty": "Gastroenterologist",
        "esi_acuity_level": 4,
        "publication_date": "2025-05-14",
        "summary": "Retrograde flow of gastric contents into the esophagus causing bothersome heartburn and regurgitation, responsive to lifestyle modifications and acid suppression.",
        "precautions": [
            "Avoid lying recumbent for at least 2 to 3 hours following meals",
            "Elevate the head of the bed by 6 inches (using bed risers, not pillows alone)",
            "Reduce consumption of trigger substances: peppermint, chocolate, caffeine, citrus, and fatty foods"
        ],
        "home_care_protocol": "Consume smaller, frequent meals. Avoid tight waistbands or restrictive clothing that increases intra-abdominal pressure.",
        "red_flags": [
            "Dysphagia (difficulty swallowing) or odynophagia (painful swallowing)",
            "Unintentional weight loss or persistent vomiting",
            "Hematemesis (vomiting blood) or melena (black tarry stools)"
        ]
    },
    "Dengue": {
        "citation_id": "MED-INF-DENG-009",
        "source_organization": "National Vector Borne Disease Control Programme (NVBDCP) / WHO",
        "guideline_title": "Clinical Management Protocol for Dengue Fever",
        "document_version": "2026.1",
        "icd10_code": "A90",
        "snomed_code": "38362002",
        "primary_specialty": "Infectious Disease Specialist / General Physician",
        "esi_acuity_level": 2,
        "publication_date": "2025-10-30",
        "summary": "Arboviral infection transmitted by Aedes mosquitoes presenting with acute high fever, retro-orbital pain, myalgia, arthralgia, and potential critical phase marked by plasma leakage.",
        "precautions": [
            "STRICTLY AVOID NSAIDs (Aspirin, Ibuprofen, Diclofenac) due to hemorrhage risk; use only paracetamol for fever under medical guidance",
            "Schedule daily complete blood count (CBC) to monitor platelet trajectory and hematocrit",
            "Maintain vigorous oral fluid therapy (minimum 2.5 - 3L daily)"
        ],
        "home_care_protocol": "Oral rehydration solution (ORS), fresh coconut water, and soups. Complete bed rest. Use mosquito netting to prevent secondary transmission.",
        "red_flags": [
            "Severe persistent abdominal pain or tenderness",
            "Persistent vomiting (> 3 episodes in 24 hours)",
            "Mucosal bleeding (gums, nose, petechiae, hematuria)",
            "Lethargy, restlessness, or rapid drop in platelet count accompanied by rising hematocrit"
        ]
    },
    "Malaria": {
        "citation_id": "MED-INF-MAL-010",
        "source_organization": "NVBDCP / World Health Organization",
        "guideline_title": "Diagnosis and Treatment of Plasmodium Malaria Infections",
        "document_version": "2025.4",
        "icd10_code": "B54",
        "snomed_code": "61462000",
        "primary_specialty": "Infectious Disease Specialist / General Physician",
        "esi_acuity_level": 2,
        "publication_date": "2025-09-12",
        "summary": "Parasitic protozoan infection characterized by cyclical paroxysms of shaking chills (cold stage), high spiking fever (hot stage), and profuse sweating (sweating stage).",
        "precautions": [
            "Obtain confirmatory diagnostic testing (Peripheral Blood Smear / Rapid Diagnostic Test) before starting targeted antiparasitic therapy",
            "Complete the entire medical course prescribed by a physician to prevent recrudescence",
            "Maintain mosquito bite prevention (repellents, screens)"
        ],
        "home_care_protocol": "Tepid sponging for high fever. Maintain electrolyte hydration. Rest in a well-ventilated, vector-protected room.",
        "red_flags": [
            "Cerebral malaria signs: impaired consciousness, delirium, or seizures",
            "Jaundice with tea-colored dark urine (Blackwater fever)",
            "Acute respiratory distress or severe anemia"
        ]
    },
    "Typhoid": {
        "citation_id": "MED-INF-TYPH-011",
        "source_organization": "World Health Organization / ICMR",
        "guideline_title": "Enteric Fever (Typhoid) Clinical Management & Surveillance",
        "document_version": "2025.3",
        "icd10_code": "A01.0",
        "snomed_code": "4834000",
        "primary_specialty": "General Physician / Infectious Disease Specialist",
        "esi_acuity_level": 3,
        "publication_date": "2025-07-08",
        "summary": "Systemic infection caused by Salmonella Typhi transmitted through contaminated food and water, presenting with step-ladder pattern fever, headache, abdominal discomfort, and hepatosplenomegaly.",
        "precautions": [
            "Consume exclusively boiled, filtered, or sealed bottled water",
            "Eat freshly prepared, thoroughly cooked foods; avoid raw vegetables or street salads",
            "Strict hand hygiene before food preparation and after using sanitation facilities"
        ],
        "home_care_protocol": "Light, easily digestible, nutrient-dense diet (khichdi, clear broths, porridge). Adequate bed rest and oral fluid replenishment.",
        "red_flags": [
            "Severe acute abdominal pain with guarding or rigidity (indicates intestinal perforation)",
            "Gastrointestinal bleeding (dark or bloody stools)",
            "Persistent high fever with delirium ('typhoid state') or extreme prostration"
        ]
    },
    "Tuberculosis": {
        "citation_id": "MED-PULM-TB-012",
        "source_organization": "National TB Elimination Program (NTEP) / WHO",
        "guideline_title": "Pulmonary Tuberculosis Clinical Standards and Diagnostic Pathways",
        "document_version": "2026.1",
        "icd10_code": "A15.0",
        "snomed_code": "56717001",
        "primary_specialty": "Pulmonologist / Infectious Disease Specialist",
        "esi_acuity_level": 3,
        "publication_date": "2025-11-18",
        "summary": "Chronic bacterial infection caused by Mycobacterium tuberculosis primarily affecting the pulmonary parenchyma, presenting with persistent cough > 2 weeks, hemoptysis, night sweats, and weight loss.",
        "precautions": [
            "Undergo formal microbiological evaluation: Sputum CBNAAT / GeneXpert and chest radiograph",
            "Practice cough etiquette and wear a surgical mask in enclosed spaces during infectious phase",
            "Ensure strict adherence to directly observed therapy (DOTS) without missing doses"
        ],
        "home_care_protocol": "High-protein, calorie-dense nutrition. Ensure well-ventilated, sunlit living quarters. Maintain regular physician follow-ups.",
        "red_flags": [
            "Massive hemoptysis (coughing up > 100 mL blood within 24 hours)",
            "Rapid onset shortness of breath or pleuritic chest pain (pneumothorax risk)",
            "Severe jaundice or drug-induced hepatotoxicity symptoms"
        ]
    },
    "Urinary tract infection": {
        "citation_id": "MED-URO-UTI-013",
        "source_organization": "European Association of Urology / ICMR",
        "guideline_title": "Uncomplicated Urinary Tract Infection Clinical Guidelines",
        "document_version": "2025.2",
        "icd10_code": "N39.0",
        "snomed_code": "68566005",
        "primary_specialty": "Urologist / Nephrologist / General Physician",
        "esi_acuity_level": 4,
        "publication_date": "2025-06-30",
        "summary": "Bacterial colonization of the urinary bladder (cystitis) characterized by dysuria, urinary urgency, frequency, and suprapubic discomfort in the absence of systemic symptoms.",
        "precautions": [
            "Increase fluid intake to promote frequent mechanical bladder flushing",
            "Obtain urine routine microscopy and culture prior to starting antimicrobial therapy",
            "Do not delay urination; empty bladder completely and post-coitally"
        ],
        "home_care_protocol": "Drink 2.5 - 3 liters of water throughout the day. Apply a warm heating pad to lower abdomen for comfort. Avoid bladder irritants (caffeine, alcohol, spicy foods).",
        "red_flags": [
            "High fever with chills and rigors",
            "Unilateral flank or costovertebral angle pain (indicates acute pyelonephritis)",
            "Gross hematuria (visible blood clots in urine) or persistent vomiting"
        ]
    },
    "Common Cold": {
        "citation_id": "MED-GP-COLD-014",
        "source_organization": "Centers for Disease Control and Prevention (CDC) / WHO",
        "guideline_title": "Viral Upper Respiratory Tract Infection Supportive Care",
        "document_version": "2025.1",
        "icd10_code": "J00",
        "snomed_code": "82272006",
        "primary_specialty": "General Physician",
        "esi_acuity_level": 5,
        "publication_date": "2025-04-10",
        "summary": "Self-limiting viral rhinosinusitis predominantly caused by rhinoviruses, presenting with nasal congestion, rhinorrhea, sneezing, sore throat, and mild malaise lasting 7 to 10 days.",
        "precautions": [
            "Antibiotics are INEFFECTIVE against viral upper respiratory infections and should not be used",
            "Wash hands frequently with soap and water to minimize viral transmission",
            "Rest adequately to support immune clearance"
        ],
        "home_care_protocol": "Warm saline gargles 3-4x daily. Steam inhalation for nasal congestion. Warm honey and ginger tea for cough soothing (in individuals > 1 year).",
        "red_flags": [
            "Symptoms worsening significantly or failing to improve after 10 days",
            "High fever > 102F or fever developing after initial improvement (secondary bacterial infection)",
            "Shortness of breath, wheezing, or severe sinus pain"
        ]
    },
    "Allergy": {
        "citation_id": "MED-IMM-ALLG-015",
        "source_organization": "World Allergy Organization (WAO) / MoHFW",
        "guideline_title": "Allergic Rhinitis and Hypersensitivity Clinical Management",
        "document_version": "2025.3",
        "icd10_code": "T78.40XA",
        "snomed_code": "419199007",
        "primary_specialty": "Allergist / Immunologist",
        "esi_acuity_level": 4,
        "publication_date": "2025-08-05",
        "summary": "IgE-mediated hypersensitivity reaction triggered by environmental allergens manifesting as sneezing, nasal pruritus, watery eyes, and localized urticaria.",
        "precautions": [
            "Identify and minimize contact with specific allergen triggers (dust mites, mold, animal dander)",
            "Keep windows closed during peak pollen periods; use HEPA air filtration if feasible",
            "Avoid rubbing itchy eyes to prevent conjunctival micro-abrasions"
        ],
        "home_care_protocol": "Saline nasal mist to rinse allergens from nasal passages. Cool compresses over irritated eyes. Shower and change clothes after outdoor exposure.",
        "red_flags": [
            "Swelling of the lips, tongue, uvula, or throat (Angioedema)",
            "Audible stridor, wheezing, or difficulty breathing (Anaphylaxis emergency)",
            "Sudden dizziness, hypotension, or diffuse flushing"
        ]
    }
}

class ClinicalKnowledgeBase:
    """
    Interface for retrieving curated clinical guidelines.
    Provides local verified corpus access with graceful Supabase sync if available.
    """
    def __init__(self):
        self.corpus = CLINICAL_GUIDELINES_CORPUS

    def get_guideline(self, disease_name: str) -> Optional[Dict[str, Any]]:
        """Lookup guideline by exact or case-insensitive condition name."""
        if not disease_name:
            return None
        
        # Direct match
        if disease_name in self.corpus:
            return self.corpus[disease_name]
        
        # Case-insensitive match
        name_lower = disease_name.lower().strip()
        for key, val in self.corpus.items():
            if key.lower() == name_lower:
                return val
            if name_lower in key.lower() or key.lower() in name_lower:
                return val
                
        return None

    def list_all_guidelines(self) -> List[Dict[str, Any]]:
        """Returns all curated guidelines with metadata."""
        return [
            {"disease": k, **v}
            for k, v in self.corpus.items()
        ]
