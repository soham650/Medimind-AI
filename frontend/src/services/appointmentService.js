import { supabase } from '../lib/supabaseClient';

/**
 * Core Service 2: Doctor & Appointment Service
 * Strictly enforces: Search ONLY Approved Doctors, View Availability,
 * Book / Cancel / Reschedule, and update Appointment Status.
 */
export const appointmentService = {
  // Search only Approved doctors with optional specialty filter
  async getApprovedDoctors(specialtyFilter = null) {
    let query = supabase
      .from('profiles')
      .select('id, full_name, name, specialist, clinic_id, experience_years, consultation_fee, is_available')
      .eq('role', 'doctor')
      .eq('approval_status', 'approved');

    if (specialtyFilter && specialtyFilter !== 'All') {
      query = query.ilike('specialist', `%${specialtyFilter}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error querying approved doctors:', error.message);
      return [];
    }
    return data || [];
  },

  // Book a new appointment
  async bookAppointment({ patientId, doctorId, appointmentDate, timeSlot, consultationType = 'video', symptomsSummary = '', patientNotes = '' }) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        consultation_type: consultationType,
        symptoms_summary: symptomsSummary,
        patient_notes: patientNotes,
        status: 'scheduled'
      })
      .select(`
        *,
        doctor:doctor_id (full_name, specialist, consultation_fee)
      `)
      .single();

    if (error) throw error;
    return data;
  },

  // Get appointments for a patient
  async getPatientAppointments(patientId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        doctor:doctor_id (full_name, specialist, clinic_id, consultation_fee)
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get appointments for a doctor (approved doctor queue)
  async getDoctorAppointments(doctorId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patient_id (full_name, age, gender, blood_sugar, bp_systolic, bp_diastolic)
      `)
      .eq('doctor_id', doctorId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Update appointment status (e.g., 'in_consultation', 'completed', 'cancelled')
  async updateStatus(appointmentId, status) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
