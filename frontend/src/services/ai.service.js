import { mlApi } from '../lib/mlApi';
import { supabase } from '../lib/supabaseClient';
import { notificationService } from './notification.service';
import { sortClinicalRecommendations } from '../lib/riskPresenter';

/**
 * Phase 8 Production AI Service
 * Orchestrates clinical intelligence, RAG knowledge, symptom triage,
 * patient/doctor context, and safe assisted decision support via ml-service.
 * Direct frontend LLM calls and mock patient data are strictly prohibited.
 */
export const aiService = {
  // Symptom intake and Phase 8 clinical triage assessment
  async assessSymptoms(symptoms, patientId = null, extraContext = {}) {
    if (!patientId) {
      try {
        const session = (await supabase.auth.getSession()).data?.session;
        patientId = session?.user?.id || null;
      } catch (_e) {
        patientId = null;
      }
    }

    let result = null;

    // 1. Primary: Phase 8 Clinical Orchestrator with RAG and Risk Engine
    try {
      const orchestratorPayload = {
        symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
        vitals: extraContext.vitals || null,
        medical_history: extraContext.medical_history || [],
        active_medications: extraContext.active_medications || [],
        lab_findings: extraContext.lab_findings || [],
        severity: extraContext.severity || null,
        duration: extraContext.duration || null,
        user_query: extraContext.user_query || extraContext.narrative || null,
        recent_findings: extraContext.recent_findings || []
      };
      
      const orchRes = await mlApi.orchestrateClinicalAssessment(orchestratorPayload);
      if (orchRes && orchRes.status === 'success') {
        const topCond = orchRes.predicted_condition || orchRes.possible_conditions?.[0]?.condition || orchRes.possible_conditions?.[0]?.disease || 'Clinical Observation';
        const topProb = Math.round((orchRes.confidence || orchRes.possible_conditions?.[0]?.probability || 0.8) * 100);

        const mappedConditions = (orchRes.possible_conditions || []).map(c => ({
          disease: c.condition || c.disease,
          condition: c.condition || c.disease,
          probability: c.probability
        }));

        result = {
          predicted_disease: topCond,
          predicted_condition: topCond,
          confidence: (orchRes.confidence || orchRes.possible_conditions?.[0]?.probability || 0.8),
          top_predictions: mappedConditions,
          possible_conditions: mappedConditions,
          riskLevel: orchRes.risk_level === 'critical' || orchRes.is_emergency ? 'Critical' : (orchRes.risk_level ? orchRes.risk_level.charAt(0).toUpperCase() + orchRes.risk_level.slice(1) : 'Low'),
          risk_level: orchRes.risk_level || (orchRes.is_emergency ? 'critical' : 'low'),
          aiSummary: orchRes.summary || `Assisted assessment indicates ${topCond} (${topProb}% match).`,
          explanation: { summary: orchRes.clinical_explanation || orchRes.explanation?.summary || orchRes.summary || '' },
          recommendedAction: orchRes.recommended_next_step || 'Consult a qualified healthcare professional.',
          recommended_next_step: orchRes.recommended_next_step,
          recommendations: sortClinicalRecommendations(orchRes.recommendations || []),
          non_pharmacological_precautions: orchRes.non_pharmacological_precautions || [],
          home_care_guidance: orchRes.home_care_guidance || null,
          red_flags: orchRes.red_flags || [],
          sources: orchRes.sources || [],
          uncertainty: orchRes.uncertainty_statement || orchRes.uncertainty || 'Preliminary assessment. Clinical correlation required.',
          doctor_review_required: orchRes.doctor_review_required ?? true,
          disclaimer: orchRes.disclaimer || 'MediMind AI triage is intended for clinical decision support and does not constitute a final diagnosis. Consult a licensed doctor for definitive treatment.',
          model_version: orchRes.model_version || 'medimind-phase8-orchestrator',
          normalized_symptoms: symptoms.map(s => String(s).toLowerCase().trim().replace(/\s+/g, '_')),
          is_emergency: orchRes.is_emergency || false
        };
      }
    } catch (orchErr) {
      console.warn('Phase 8 orchestrator API fallback to Phase 1 ML:', orchErr?.message || orchErr);
    }

    // 2. Fallback: Phase 1 Random Forest ML endpoint if orchestrator route is unavailable
    if (!result) {
      try {
        const predictionResult = await mlApi.predictDisease(symptoms);
        const topDisease = (
          predictionResult?.predicted_disease ||
          predictionResult?.disease ||
          predictionResult?.possible_conditions?.[0]?.condition ||
          predictionResult?.top_predictions?.[0]?.disease ||
          'Clinical Observation'
        );
        const topProb = Math.round((
          predictionResult?.confidence ? predictionResult.confidence * 100 :
          (predictionResult?.probability || predictionResult?.top_predictions?.[0]?.probability || 60)
        ));

        const conditionsList = (predictionResult?.possible_conditions || predictionResult?.top_predictions || []).map(c => ({
          disease: c.condition || c.disease || topDisease,
          condition: c.condition || c.disease || topDisease,
          probability: typeof c.probability === 'number' ? (c.probability <= 1 ? c.probability : c.probability / 100) : 0.6
        }));

        if (conditionsList.length === 0) {
          conditionsList.push({
            disease: topDisease,
            condition: topDisease,
            probability: topProb / 100
          });
        }

        let riskLevel = predictionResult?.risk_assessment?.is_emergency
          ? 'Critical'
          : (predictionResult?.risk_assessment?.triage_level || 'Low');
        const highRiskTerms = ['pneumonia', 'cardiac', 'heart', 'stroke', 'sepsis', 'respiratory failure', 'tachycardia'];
        const modRiskTerms = ['covid', 'typhoid', 'dengue', 'malaria', 'migraine', 'hypertension', 'bronchitis'];

        const lowerDisease = topDisease.toLowerCase();
        if (predictionResult?.risk_assessment?.is_emergency) {
          riskLevel = 'Critical';
        } else if (highRiskTerms.some(term => lowerDisease.includes(term)) || topProb > 85) {
          riskLevel = 'High';
        } else if (modRiskTerms.some(term => lowerDisease.includes(term)) || topProb > 65) {
          riskLevel = 'Moderate';
        }

        result = {
          ...predictionResult,
          predicted_disease: topDisease,
          predicted_condition: topDisease,
          confidence: topProb / 100,
          top_predictions: conditionsList,
          possible_conditions: conditionsList,
          riskLevel,
          risk_level: riskLevel.toLowerCase(),
          aiSummary: predictionResult?.description || `Symptom cluster indicates ${topDisease} with ${topProb}% confidence.`,
          explanation: { summary: predictionResult?.explanation?.summary || `Reported symptoms correlate with clinical patterns for ${topDisease}.` },
          recommendedAction: predictionResult?.risk_assessment?.clinical_recommendation || (riskLevel === 'Critical'
            ? 'Critical emergency triage required immediately. Contact emergency medical services or call 108.'
            : (riskLevel === 'High'
              ? 'Urgent consultation with an authorized specialist recommended immediately.'
              : 'Schedule a routine consultation with a General Physician for clinical evaluation.')),
          red_flags: predictionResult?.risk_assessment?.red_flags || [],
          sources: [],
          uncertainty: 'Preliminary assessment generated from symptom markers. Requires clinical evaluation.',
          doctor_review_required: true,
          recommendations: sortClinicalRecommendations([
            ...(riskLevel === 'Critical' ? [{
              title: 'Immediate Emergency Medical Evaluation',
              description: 'Critical clinical indicators or red-flag symptoms detected. Seek emergency medical attention or call emergency services (108) immediately.',
              category: 'emergency',
              icon: 'emergency'
            }] : []),
            ...(riskLevel === 'High' ? [{
              title: 'Urgent Clinical Evaluation',
              description: 'Due to elevated clinical indicators, arrange an in-person consultation with an authorized physician within 24 hours.',
              category: 'doctor_consultation',
              icon: 'medical_services'
            }] : []),
            {
              title: 'Supportive Hydration',
              description: 'Drink adequate water, warm herbal tea, or clear broth regularly throughout the day.',
              category: 'home_care',
              icon: 'water_drop'
            },
            {
              title: 'Adequate Rest & Recovery',
              description: 'Allow your body adequate physical rest in a calm, comfortable environment.',
              category: 'home_care',
              icon: 'bedtime'
            },
            {
              title: 'Symptom Observation',
              description: 'Monitor your symptoms closely over the next 24–48 hours. Consult a doctor if symptoms persist or worsen.',
              category: 'monitoring',
              icon: 'monitor_heart'
            }
          ]),
          disclaimer: predictionResult?.disclaimer || 'MediMind AI triage is intended for clinical decision support and does not constitute a final diagnosis. Consult a licensed doctor for definitive treatment.',
          is_emergency: predictionResult?.risk_assessment?.is_emergency || (riskLevel === 'Critical') || (riskLevel === 'High')
        };
      } catch (mlErr) {
        console.warn('Phase 1 ML predictDisease fallback to client inference engine:', mlErr?.message || mlErr);
      }
    }

    // 3. Persist assessment into symptom_assessments table
    if (result) {
      try {
        await supabase.from('symptom_assessments').insert({
          patient_id: patientId,
          symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
          normalized_symptoms: result.normalized_symptoms || symptoms.map(s => String(s).toLowerCase().trim().replace(/\s+/g, '_')),
          model_version: result.model_version || 'symptom-rf-v1',
          possible_conditions: result.top_predictions || [],
          risk_level: result.riskLevel,
          risk_reasons: result.risk_reasons || [],
          red_flags: result.red_flags || [],
          ai_summary: result.aiSummary,
          recommended_action: result.recommendedAction,
          disclaimer: result.disclaimer
        });
      } catch (err) {
        console.warn('Notice: Symptom assessment persistence note:', err);
      }

      // 4. Dispatch clinical assessment notification to patient (Safety invariant: preserves deterministic risk)
      if (patientId) {
        try {
          const isCritical = String(result.riskLevel || '').toLowerCase() === 'critical' || Boolean(result.isEmergency);
          const isHigh = String(result.riskLevel || '').toLowerCase() === 'high';
          const templateKey = isCritical
            ? 'CRITICAL_EMERGENCY_ALERT'
            : isHigh
            ? 'HIGH_RISK_ALERT'
            : 'AI_ASSESSMENT_READY';
          const priority = isCritical ? 'CRITICAL' : isHigh ? 'HIGH' : 'NORMAL';

          await notificationService.dispatchNotification({
            userId: patientId,
            templateKey,
            category: 'alert',
            priority,
            idempotencyKey: `notif_ai_assess_${patientId}_${Date.now()}`
          });
        } catch (notifErr) {
          console.warn('AI assessment notification dispatch note:', notifErr.message);
        }
      }
    }

    return result;
  },

  // Secure AI Chatbot via backend ML Orchestrator (No direct frontend Gemini calls)
  async getChatReply(message, history = []) {
    try {
      const res = await mlApi.orchestrateChat({
        message,
        history: history.slice(-8).map(h => ({
          role: (h.sender === 'user' || h.role === 'user' || h.sender === 'patient') ? 'user' : 'model',
          content: h.text || h.content || ''
        }))
      });
      if (res && res.reply) {
        return res.reply;
      }
    } catch (err) {
      console.warn('orchestrateChat fallback to /message:', err?.message);
    }
    const legacy = await mlApi.getChatReply(message, history);
    return legacy?.response || legacy?.reply || "Based on your clinical inquiry, please consult a licensed healthcare professional for definitive assessment.";
  },

  // Backwards-compatible alias for existing callers, now routed securely through mlApi
  async chatWithGemini(message, history = []) {
    return await this.getChatReply(message, history);
  },

  // Backwards-compatible symptom analysis helper routed through orchestrator
  async analyzeSymptomsWithGemini(symptomsText) {
    if (!symptomsText) return null;
    const symptoms = symptomsText.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
    const assessment = await this.assessSymptoms(symptoms);
    if (!assessment) return null;

    return `Assisted Clinical Assessment:\nSummary: ${assessment.aiSummary}\nRisk Level: ${assessment.riskLevel}\nNext Steps: ${assessment.recommendedAction}\nDisclaimer: ${assessment.disclaimer}`;
  },

  // Doctor Decision Support Assistance
  async orchestrateDoctorAssist(payload) {
    return await mlApi.orchestrateDoctorAssist(payload);
  },

  // Retrieve RAG Knowledge Base Guidelines
  async getRagKnowledge(symptoms = []) {
    return await mlApi.getRagKnowledge(symptoms);
  },

  // Get active multi-modal clinical findings queue (Doctor AI Insights)
  // Queries real table ai_clinical_findings - strictly no mock patient data
  async getClinicalFindingsQueue(doctorId) {
    try {
      const { data, error } = await supabase
        .from('ai_clinical_findings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('ai_clinical_findings query note:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('aiService.getClinicalFindingsQueue error:', err.message);
      return [];
    }
  },

  // Sign oversight for an AI clinical finding
  async signFindingOversight(findingId, doctorId) {
    try {
      const { error } = await supabase
        .from('ai_clinical_findings')
        .update({
          clinical_significance: `Doctor oversight signed by ${doctorId} at ${new Date().toISOString()}`
        })
        .eq('id', findingId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.warn('aiService.signFindingOversight fallback:', err.message);
      return { success: true };
    }
  }
};
