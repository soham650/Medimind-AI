import { supabase } from '../lib/supabaseClient';

/**
 * Production Medical Records Service
 * RLS protected patient health records, diagnostic summaries, and allergies.
 */
export const medicalRecordsService = {
  // Fetch medical records for authorized user
  async getRecords(patientId) {
    const { data, error } = await supabase
      .from('medical_records')
      .select(`
        id,
        record_type,
        title,
        clinical_summary,
        structured_data,
        record_date,
        created_at,
        doctor:doctor_id (full_name, specialization)
      `)
      .eq('patient_id', patientId)
      .order('record_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Add new clinical record
  async addRecord({ patientId, doctorId = null, consultationId = null, recordType, title, clinicalSummary, structuredData = {} }) {
    const { data, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        consultation_id: consultationId,
        record_type: recordType,
        title,
        clinical_summary: clinicalSummary,
        structured_data: structuredData
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Patient allergies
  async getAllergies(patientId) {
    const { data, error } = await supabase
      .from('patient_allergies')
      .select('*')
      .eq('patient_id', patientId);

    if (error) return [];
    return data || [];
  },

  async addAllergy(patientId, allergen, severity = 'Moderate', reactionNotes = '') {
    const { data, error } = await supabase
      .from('patient_allergies')
      .insert({
        patient_id: patientId,
        allergen,
        severity,
        reaction_notes: reactionNotes
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};
