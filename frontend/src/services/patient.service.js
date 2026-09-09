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

  // Update patient settings (language, timezone, preferences)
  async updateSettings(patientId, settings) {
    const { preferred_language, timezone } = settings;
    const updates = {};
    if (preferred_language) updates.preferred_language = preferred_language;
    if (timezone) updates.timezone = timezone;
    updates.updated_at = new Date().toISOString();

    const [patientRes, profileRes] = await Promise.all([
      supabase.from('patients').update(updates).eq('id', patientId).select().single(),
      supabase.from('profiles').update(updates).eq('id', patientId)
    ]);

    if (patientRes.error) throw new Error(patientRes.error.message);
    return patientRes.data;
  },

  // Real aggregate summary for Patient Dashboard
  async getDashboardSummary(patientId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [apptsRes, rxRes, ordersRes, vitalsRes, assessRes, reportsRes, notifsRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('id, appointment_number, appointment_date, time_slot, consultation_type, status, doctor_id, doctor:doctor_id(full_name, specialization, clinic_name)')
          .eq('patient_id', patientId)
          .gte('appointment_date', today)
          .order('appointment_date', { ascending: true })
          .limit(5),
        supabase
          .from('prescriptions')
          .select('id, rx_id, diagnosis, created_at, doctor:doctor_id(full_name, specialization)')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('medicine_orders')
          .select('id, order_number, total_amount, order_status, created_at, pharmacy:pharmacy_id(pharmacy_name)')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('patients')
          .select('bp_systolic, bp_diastolic, blood_sugar, bmi, is_smoker, full_name, preferred_language')
          .eq('id', patientId)
          .single(),
        supabase
          .from('symptom_assessments')
          .select('id, symptoms, risk_level, possible_conditions, ai_summary, recommended_action, created_at')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('health_reports')
          .select('id, report_title, report_type, processing_status, created_at')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase
          .from('notifications')
          .select('id, title, message, is_read, type, created_at')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      return {
        upcomingAppointments: apptsRes.data || [],
        recentPrescriptions: rxRes.data || [],
        recentOrders: ordersRes.data || [],
        recentAssessments: assessRes.data || [],
        recentReports: reportsRes.data || [],
        notifications: notifsRes.data || [],
        vitals: vitalsRes.data || { bp_systolic: 120, bp_diastolic: 80, blood_sugar: 100, bmi: 22.0, is_smoker: false }
      };
    } catch (err) {
      console.error('Error fetching patient dashboard summary:', err);
      return {
        upcomingAppointments: [],
        recentPrescriptions: [],
        recentOrders: [],
        recentAssessments: [],
        recentReports: [],
        notifications: [],
        vitals: { bp_systolic: 120, bp_diastolic: 80, blood_sugar: 100, bmi: 22.0, is_smoker: false }
      };
    }
  },

  // Fetch patient allergies
  async getAllergies(patientId) {
    const { data, error } = await supabase
      .from('patient_allergies')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Allergies fetch notice:', error.message);
      return [];
    }
    return data || [];
  },

  // Add an allergy record
  async addAllergy(patientId, { allergen, allergenType = 'Medication', severity = 'Moderate', reactionNotes = '' }) {
    const { data, error } = await supabase
      .from('patient_allergies')
      .insert({
        patient_id: patientId,
        allergen,
        allergen_type: allergenType,
        severity,
        reaction_notes: reactionNotes
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Remove an allergy record
  async removeAllergy(allergyId) {
    const { error } = await supabase
      .from('patient_allergies')
      .delete()
      .eq('id', allergyId);

    if (error) throw new Error(error.message);
    return true;
  },

  // Upload user avatar to profile-images public bucket
  async uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    // Update profiles table
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return publicUrl;
  }
};
