import os
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from src.rag.knowledge_base import ClinicalKnowledgeBase

class ClinicalRAGRetriever:
    """
    Controlled Clinical Retrieval-Augmented Generation (RAG) Engine.
    Queries curated, authoritative clinical guidelines based on ML predictions,
    symptom presentations, and emergency risk levels.
    """
    def __init__(self, knowledge_base: Optional[ClinicalKnowledgeBase] = None):
        self.kb = knowledge_base or ClinicalKnowledgeBase()

    def retrieve_for_assessment(
        self,
        predicted_disease: Optional[str] = None,
        possible_conditions: Optional[List[Dict[str, Any]]] = None,
        symptoms: Optional[List[str]] = None,
        is_emergency: bool = False,
        max_chunks: int = 3
    ) -> Dict[str, Any]:
        """
        Retrieves relevant clinical guidelines and builds strict citation allowlist.
        Returns:
            retrieved_guidelines: List[Dict] with full provenance metadata
            citation_allowlist: Set of valid citation IDs
            formatted_context: XML-wrapped reference text for prompt injection defense
        """
        candidate_names = []
        if predicted_disease:
            candidate_names.append(predicted_disease)
        
        if possible_conditions:
            for item in possible_conditions:
                cond = item.get("condition") or item.get("disease")
                if cond and cond not in candidate_names:
                    candidate_names.append(cond)

        # Emergency priority: If emergency flag is set and chest pain is reported, prioritize Heart Attack protocol
        if is_emergency and symptoms:
            has_chest = any("chest" in s.lower() or "heart" in s.lower() for s in symptoms)
            if has_chest:
                if "Heart attack" in candidate_names:
                    candidate_names.remove("Heart attack")
                candidate_names.insert(0, "Heart attack")
            for s in symptoms:
                if ("breath" in s.lower() or "wheez" in s.lower()) and "Bronchial Asthma" not in candidate_names:
                    candidate_names.append("Bronchial Asthma")

        retrieved: List[Dict[str, Any]] = []
        seen_citations = set()
        timestamp = datetime.now(timezone.utc).isoformat()

        for name in candidate_names[:5]:
            guide = self.kb.get_guideline(name)
            if guide and guide["citation_id"] not in seen_citations:
                seen_citations.add(guide["citation_id"])
                
                # Check for staleness (> 36 months)
                pub_date = guide.get("publication_date", "2025-01-01")
                is_stale = False
                try:
                    pub_dt = datetime.strptime(pub_date, "%Y-%m-%d")
                    age_days = (datetime.now() - pub_dt).days
                    if age_days > (36 * 30):
                        is_stale = True
                except Exception:
                    pass

                retrieved.append({
                    "citation_id": guide["citation_id"],
                    "disease_target": name,
                    "source_organization": guide.get("source_organization", "Authoritative Healthcare Reference"),
                    "guideline_title": guide.get("guideline_title", f"Clinical Guideline for {name}"),
                    "document_version": guide.get("document_version", "2026.1"),
                    "icd10_code": guide.get("icd10_code", "N/A"),
                    "snomed_code": guide.get("snomed_code", "N/A"),
                    "primary_specialty": guide.get("primary_specialty", "General Physician"),
                    "esi_acuity_level": guide.get("esi_acuity_level", 4),
                    "publication_date": pub_date,
                    "retrieval_timestamp": timestamp,
                    "summary": guide.get("summary", ""),
                    "precautions": guide.get("precautions", []),
                    "home_care_protocol": guide.get("home_care_protocol", ""),
                    "red_flags": guide.get("red_flags", []),
                    "is_stale": is_stale
                })

                if len(retrieved) >= max_chunks:
                    break

        # Construct XML-isolated prompt context block
        formatted_context = self._format_as_xml_context(retrieved)

        return {
            "retrieved_guidelines": retrieved,
            "citation_allowlist": list(seen_citations),
            "formatted_context": formatted_context,
            "retrieval_count": len(retrieved),
            "retrieval_timestamp": timestamp
        }

    def _format_as_xml_context(self, guidelines: List[Dict[str, Any]]) -> str:
        """Formats guidelines into strictly isolated XML reference text."""
        if not guidelines:
            return "<retrieved_clinical_knowledge>\n  <!-- No specific guideline matched. Rely on conservative clinical safety principles. -->\n</retrieved_clinical_knowledge>"

        lines = ["<retrieved_clinical_knowledge>"]
        for g in guidelines:
            lines.append(f'  <guideline citation_id="{g["citation_id"]}" id="{g["citation_id"]}" icd10="{g["icd10_code"]}" acuity="{g["esi_acuity_level"]}">')
            lines.append(f'    <title>{g["guideline_title"]} (Source: {g["source_organization"]}, Ver: {g["document_version"]})</title>')
            lines.append(f'    <summary>{g["summary"]}</summary>')
            lines.append(f'    <recommended_specialist>{g["primary_specialty"]}</recommended_specialist>')
            if g.get("precautions"):
                lines.append(f'    <precautions>{"; ".join(g["precautions"])}</precautions>')
            if g.get("home_care_protocol"):
                lines.append(f'    <home_care>{g["home_care_protocol"]}</home_care>')
            if g.get("red_flags"):
                lines.append(f'    <red_flags>{"; ".join(g["red_flags"])}</red_flags>')
            lines.append("  </guideline>")
        lines.append("</retrieved_clinical_knowledge>")

        return "\n".join(lines)
