import { supabase } from '../lib/supabaseClient';

/**
 * Production Patient Service
 * Real database queries for patient records, baseline vitals, and dashboard KPIs.
 */
export const patientService = {
  // Fetch patient profile
  async getProfile(patientId) {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Patient profile fetch note:', error.message);
    }
    return data || null;
  },

  // Update profile attributes (sanitizing protected fields)
  async updateProfile(patientId, updates) {
    // Exclude protected attributes
    const { role, verification_status, id, created_at, ...allowedUpdates } = updates;

    const { data, error } = await supabase
      .from('patients')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Update vitals (BP, sugar, BMI, smoking)
  async updateVitals(patientId, vitals) {
    const { data, error } = await supabase
      .from('patients')
      .update({
        bp_systolic: vitals.bpSystolic || vitals.bp_systolic,
        bp_diastolic: vitals.bpDiastolic || vitals.bp_diastolic,
        blood_sugar: vitals.bloodSugar || vitals.blood_sugar,
        bmi: vitals.bmi,
        is_smoker: vitals.isSmoker ?? vitals.is_smoker,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Real aggregate summary for Patient Dashboard
  async getDashboardSummary(patientId) {
    try {
      const [apptsRes, rxRes, ordersRes, vitalsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, appointment_number, appointment_date, time_slot, consultation_type, status, doctor_id, doctors(full_name, specialization, clinic_name)')
          .eq('patient_id', patientId)
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .order('appointment_date', { ascending: true })
          .limit(5),
        supabase
          .from('prescriptions')
          .select('id, rx_id, diagnosis, created_at, doctors(full_name, specialization)')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('medicine_orders')
          .select('id, order_number, total_amount, order_status, created_at')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('patients')
          .select('bp_systolic, bp_diastolic, blood_sugar, bmi, is_smoker')
          .eq('id', patientId)
          .single()
      ]);

      return {
        upcomingAppointments: apptsRes.data || [],
        recentPrescriptions: rxRes.data || [],
        recentOrders: ordersRes.data || [],
        vitals: vitalsRes.data || { bp_systolic: 120, bp_diastolic: 80, blood_sugar: 100, bmi: 22.0, is_smoker: false }
      };
    } catch (err) {
      console.error('Error fetching patient dashboard summary:', err);
      return {
        upcomingAppointments: [],
        recentPrescriptions: [],
        recentOrders: [],
        vitals: { bp_systolic: 120, bp_diastolic: 80, blood_sugar: 100, bmi: 22.0, is_smoker: false }
      };
    }
  }
};
