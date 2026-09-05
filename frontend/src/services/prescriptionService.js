import { supabase } from '../lib/supabaseClient';

/**
 * Core Service 4: Prescription Service
 * Generates digital prescriptions with unique Rx ID, manages patient prescription history,
 * and allows sharing directly to approved pharmacies.
 */
export const prescriptionService = {
  // Generate a unique Rx ID (e.g. RX-2026-5832)
  generateRxId() {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    return `RX-${year}-${randomNum}`;
  },

  // Issue a new digital prescription
  async createPrescription({ doctorId, patientId, appointmentId = null, diagnosis, medicines, generalAdvice = '' }) {
    const rxId = this.generateRxId();

    const { data, error } = await supabase
      .from('prescriptions')
      .insert({
        rx_id: rxId,
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_id: appointmentId,
        diagnosis,
        medicines, // [{ name, dosage, frequency, duration, instructions }]
        general_advice: generalAdvice,
        is_dispensed: false
      })
      .select(`
        *,
        doctor:doctor_id (full_name, specialist, license_number),
        patient:patient_id (full_name, age, gender)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Get prescription history for a patient
  async getPatientPrescriptions(patientId) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctor:doctor_id (full_name, specialist, clinic_id)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get prescription by Rx ID (for pharmacy verification)
  async getPrescriptionByRxId(rxId) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        *,
        doctor:doctor_id (full_name, specialist, license_number),
        patient:patient_id (full_name, age, gender)
      `)
      .eq('rx_id', rxId.trim().toUpperCase())
      .single();

    if (error) throw error;
    return data;
  }
};
