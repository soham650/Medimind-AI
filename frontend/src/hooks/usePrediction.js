import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mlApi } from '../lib/mlApi';
import { useAuth } from './useAuth';

export function usePrediction() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const getPrediction = async (symptoms, currentMedication = '') => {
    setLoading(true);
    setError(null);
    try {
      // 1. Call FastAPI prediction endpoint
      const result = await mlApi.predictDisease(symptoms);
      
      // 2. Check for medication conflict cautions locally or on microservice
      // (FastAPI disease predictor returns standard output without caution since caution needs currentMedication)
      let cautionMessage = null;
      if (currentMedication && result.disease) {
        const DRUG_CONFLICTS = {
          "Coronary Heart Disease": {
            treatment: "Aspirin (anti-platelet)",
            conflicts: {
              "warfarin": "Risk of severe internal bleeding. Both are strong blood thinners.",
              "heparin": "Risk of severe internal bleeding. Both are strong blood thinners.",
              "ibuprofen": "NSAIDs like Ibuprofen can increase the risk of stomach ulcers and reduce the cardioprotective effect of Aspirin."
            }
          },
          "Diabetes": {
            treatment: "Metformin (anti-diabetic)",
            conflicts: {
              "atenolol": "Beta-blockers like Atenolol can mask critical symptoms of hypoglycemia (low blood sugar), such as rapid heart rate.",
              "propranolol": "Beta-blockers can mask hypoglycemia symptoms and prolong low blood sugar events."
            }
          },
          "Common Cold": {
            treatment: "Decongestants (Pseudoephedrine)",
            conflicts: {
              "atenolol": "Decongestants constrict blood vessels and can elevate blood pressure, neutralizing your anti-hypertensive medication.",
              "amlodipine": "Decongestants can elevate blood pressure, opposing your blood pressure control."
            }
          },
          "Migraine": {
            treatment: "Ibuprofen (NSAID)",
            conflicts: {
              "warfarin": "Risk of severe stomach bleeding when mixing NSAIDs with oral anticoagulants.",
              "aspirin": "Combining multiple NSAIDs increases the risk of gastrointestinal irritation and bleeding."
            }
          }
        };

        const disease = result.disease;
        const reportedMed = currentMedication.toLowerCase().trim();
        const conflictDef = DRUG_CONFLICTS[disease];
        if (conflictDef) {
          for (let key in conflictDef.conflicts) {
            if (reportedMed.includes(key)) {
              cautionMessage = `CAUTION: Consult your doctor before taking treatment for ${disease} (${conflictDef.treatment}). It may conflict with your current medication '${currentMedication}'. ${conflictDef.conflicts[key]}`;
              result.caution = {
                treatment: conflictDef.treatment,
                reportedMedication: currentMedication,
                message: cautionMessage
              };
              break;
            }
          }
        }
      }

      // 3. Log results to Supabase public.predictions
      if (user) {
        const { error: dbError } = await supabase.from('predictions').insert({
          patient_id: user.id,
          symptoms,
          predicted_disease: result.disease,
          probability: result.probability,
          reliability: result.reliability,
          specialist: result.recommendation.specialist,
          caution: cautionMessage
        });
        if (dbError) console.error('Error saving prediction to Supabase:', dbError.message);
      }

      setPrediction(result);
      return result;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    prediction,
    loading,
    error,
    getPrediction
  };
}
