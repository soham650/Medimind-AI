import { supabase } from '../lib/supabaseClient';

/**
 * Production Appointment Service
 * Uses atomic PostgreSQL transactions (RPC) to guarantee no double-booking and automatic access bridge.
 */
export const appointmentService = {
  // Book an appointment atomically via create_appointment_tx
  async createAppointment({ doctorId, appointmentDate, timeSlot, consultationType = 'video', symptomsSummary = '', patientNotes = '' }) {
    const { data, error } = await supabase.rpc('create_appointment_tx', {
      p_doctor_id: doctorId,
      p_appointment_date: appointmentDate,
      p_time_slot: timeSlot,
      p_consultation_type: consultationType,
      p_symptoms_summary: symptomsSummary,
      p_patient_notes: patientNotes
    });

    if (error) throw new Error(this.friendlyError(error));
    return data;
  },

  // Get single appointment details by ID
  async getAppointmentById(appointmentId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_number,
        appointment_date,
        time_slot,
        consultation_type,
        status,
        symptoms_summary,
        patient_notes,
        cancellation_reason,
        created_at,
        patient_id,
        doctor_id,
        patient:patient_id (
          id,
          full_name,
          phone,
          abha_id,
          blood_group,
          bp_systolic,
          bp_diastolic,
          blood_sugar,
          bmi,
          emergency_contact,
          preferred_language
        ),
        doctor:doctor_id (
          id,
          full_name,
          specialization,
          license_number,
          clinic_name
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Get patient appointments list
  async getPatientAppointments(patientId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_number,
        appointment_date,
        time_slot,
        consultation_type,
        status,
        symptoms_summary,
        patient_notes,
        cancellation_reason,
        created_at,
        doctor:doctor_id (
          id,
          full_name,
          specialization,
          clinic_name,
          consultation_fee
        )
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Get doctor appointments queue with optional filtering
  async getDoctorAppointments(doctorId, filters = {}) {
    let query = supabase
      .from('appointments')
      .select(`
        id,
        appointment_number,
        appointment_date,
        time_slot,
        consultation_type,
        status,
        symptoms_summary,
        patient_notes,
        cancellation_reason,
        created_at,
        patient:patient_id (
          id,
          full_name,
          phone,
          abha_id,
          blood_group,
          bp_systolic,
          bp_diastolic,
          blood_sugar
        )
      `)
      .eq('doctor_id', doctorId);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.date) {
      query = query.eq('appointment_date', filters.date);
    }
    if (filters.consultationType && filters.consultationType !== 'all') {
      query = query.eq('consultation_type', filters.consultationType);
    }

    const { data, error } = await query.order('appointment_date', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Update appointment status with optional cancellation reason
  async updateStatus(appointmentId, status, reason = null) {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };
    if (reason) {
      updates.cancellation_reason = reason;
    }

    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  friendlyError(err) {
    const msg = err.message || '';
    if (msg.includes('no longer available') || msg.includes('unique constraint') || msg.includes('already booked')) {
      return 'This appointment slot is no longer available. Please choose another time.';
    }
    if (msg.includes('in the past')) {
      return 'Cannot book an appointment for a past date.';
    }
    if (msg.includes('not verified')) {
      return 'Selected doctor is undergoing credential verification and cannot accept bookings yet.';
    }
    return msg || 'Failed to book appointment.';
  }
};
