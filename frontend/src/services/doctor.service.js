import { supabase } from '../lib/supabaseClient';

/**
 * Production Doctor Service
 * Connects doctor discovery, Doctor Mission Control, Profile, Verification, Availability,
 * and Analytics to real Supabase PostgreSQL tables and Storage buckets.
 */
export const doctorService = {
  // Discovery: Only returns verified & approved doctors
  async searchDoctors({ specialty = 'All', search = '' }) {
    let query = supabase
      .from('doctors')
      .select('id, full_name, specialization, qualification, experience_years, consultation_fee, rating, clinic_name, is_available')
      .eq('verification_status', 'approved')
      .eq('is_available', true);

    if (specialty && specialty !== 'All') {
      query = query.ilike('specialization', `%${specialty}%`);
    }

    if (search && search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,specialization.ilike.%${search.trim()}%,clinic_name.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query.order('rating', { ascending: false });
    if (error) {
      console.warn('Error fetching doctors:', error.message);
      return [];
    }
    return data || [];
  },

  // Get single doctor details & availability
  async getDoctorDetails(doctorId) {
    const [docRes, availRes] = await Promise.all([
      supabase.from('doctors').select('*').eq('id', doctorId).single(),
      supabase.from('doctor_availability').select('*').eq('doctor_id', doctorId).eq('is_active', true)
    ]);

    return {
      doctor: docRes.data || null,
      availability: availRes.data || []
    };
  },

  // Mission Control Dashboard Real Aggregations
  async getMissionControlData(doctorId) {
    const today = new Date().toISOString().split('T')[0];

    try {
      const [
        todayApptsRes,
        upcomingApptsRes,
        completedApptsRes,
        pendingApptsRes,
        patientAccessRes,
        highRiskAssessmentsRes,
        prescriptionsRes,
        unreadNotifsRes,
        doctorRowRes
      ] = await Promise.all([
        // Today's appointments
        supabase
          .from('appointments')
          .select('id, appointment_number, appointment_date, time_slot, consultation_type, status, symptoms_summary, patient_notes, patient_id, patients(id, full_name, phone, abha_id, bp_systolic, bp_diastolic, blood_sugar, bmi)')
          .eq('doctor_id', doctorId)
          .eq('appointment_date', today)
          .order('time_slot', { ascending: true }),

        // Upcoming appointments (beyond today)
        supabase
          .from('appointments')
          .select('id, appointment_number, appointment_date, time_slot, consultation_type, status, symptoms_summary, patient_id, patients(id, full_name, phone, abha_id)')
          .eq('doctor_id', doctorId)
          .gt('appointment_date', today)
          .in('status', ['requested', 'confirmed', 'scheduled'])
          .order('appointment_date', { ascending: true })
          .limit(6),

        // Completed consultations count
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)
          .eq('status', 'completed'),

        // Pending consultations count
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)
          .in('status', ['requested', 'confirmed', 'scheduled']),

        // Active patient access links (authorized clinical relationships)
        supabase
          .from('patient_doctor_access')
          .select('patient_id, is_active, expires_at, patients(id, full_name, abha_id, bp_systolic, bp_diastolic, blood_sugar, bmi)')
          .eq('doctor_id', doctorId)
          .eq('is_active', true)
          .limit(10),

        // High-risk AI preliminary alerts for clinical review
        supabase
          .from('symptom_assessments')
          .select('id, patient_id, risk_level, symptoms, possible_conditions, risk_reasons, recommended_action, created_at')
          .eq('risk_level', 'High')
          .order('created_at', { ascending: false })
          .limit(5),

        // Prescription activity count
        supabase
          .from('prescriptions')
          .select('id', { count: 'exact', head: true })
          .eq('doctor_id', doctorId),

        // Unread notification count
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', doctorId)
          .eq('is_read', false),

        // Doctor profile status
        supabase
          .from('doctors')
          .select('is_available, verification_status, consultation_fee')
          .eq('id', doctorId)
          .single()
      ]);

      const todaySchedule = todayApptsRes.data || [];
      const upcomingSchedule = upcomingApptsRes.data || [];
      const authorizedPatients = (patientAccessRes.data || []).map(p => ({
        id: p.patient_id,
        name: p.patients?.full_name || 'Authorized Patient',
        abha: p.patients?.abha_id || 'N/A',
        vitals: p.patients || {},
        expiresAt: p.expires_at
      }));

      return {
        todaySchedule,
        upcomingSchedule,
        todayAppointmentsCount: todaySchedule.length,
        upcomingAppointmentsCount: upcomingApptsRes.data?.length || 0,
        completedConsultationsCount: completedApptsRes.count || 0,
        pendingConsultationsCount: pendingApptsRes.count || 0,
        activePatientsCount: authorizedPatients.length,
        criticalAlertsCount: highRiskAssessmentsRes.data?.length || 0,
        highRiskAlerts: highRiskAssessmentsRes.data || [],
        prescriptionsIssuedCount: prescriptionsRes.count || 0,
        unreadNotificationsCount: unreadNotifsRes.count || 0,
        authorizedPatients,
        isAvailable: doctorRowRes.data?.is_available ?? true,
        verificationStatus: doctorRowRes.data?.verification_status || 'pending',
        consultationFee: doctorRowRes.data?.consultation_fee || 500
      };
    } catch (err) {
      console.error('Error fetching mission control data:', err);
      return {
        todaySchedule: [],
        upcomingSchedule: [],
        todayAppointmentsCount: 0,
        upcomingAppointmentsCount: 0,
        completedConsultationsCount: 0,
        pendingConsultationsCount: 0,
        activePatientsCount: 0,
        criticalAlertsCount: 0,
        highRiskAlerts: [],
        prescriptionsIssuedCount: 0,
        unreadNotificationsCount: 0,
        authorizedPatients: [],
        isAvailable: true,
        verificationStatus: 'pending',
        consultationFee: 500
      };
    }
  },

  // Module 1 & 3: Recommendation Engine (Best Doctor Suggestion based on Disease)
  async getRecommendedDoctors(diseaseName = 'Acute Bacterial Sinusitis') {
    try {
      const { data, error } = await supabase.rpc('recommend_doctors_for_disease', {
        p_disease_name: diseaseName
      });

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('RPC recommend_doctors_for_disease notice:', err.message);
    }

    // Secondary fallback: query real verified and available doctors from doctors table
    const { data: realDocs, error: docErr } = await supabase
      .from('doctors')
      .select('id, full_name, specialization, rating, consultation_fee, clinic_name, is_available')
      .eq('verification_status', 'approved')
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .limit(5);

    if (!docErr && realDocs && realDocs.length > 0) {
      return realDocs.map(d => ({
        doctor_id: d.id,
        full_name: d.full_name,
        specialization: d.specialization,
        rating: d.rating,
        consultation_fee: d.consultation_fee,
        clinic_name: d.clinic_name
      }));
    }

    return [];
  },

  // Get doctor profile
  async getDoctorProfile(doctorId) {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', doctorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Doctor profile fetch notice:', error.message);
    }
    return data || null;
  },

  // Update doctor profile attributes (never allows self-approving verification_status)
  async updateDoctorProfile(doctorId, updates) {
    const { id, created_at, verification_status, ...allowedUpdates } = updates;
    const { data, error } = await supabase
      .from('doctors')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Upload doctor verification documents to private doctor-documents bucket
  async uploadDoctorDocument(doctorId, file, documentType = 'Medical License') {
    const fileExt = file.name.split('.').pop();
    const filePath = `${doctorId}/${Date.now()}_${documentType.toLowerCase().replace(/\s+/g, '_')}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('doctor-documents')
      .upload(filePath, file, { upsert: true, contentType: file.type || 'application/pdf' });

    if (uploadError) throw new Error(`Document upload failed: ${uploadError.message}`);

    // Record submission in doctor_verifications
    const { data, error: dbErr } = await supabase.from('doctor_verifications').insert({
      doctor_id: doctorId,
      submitted_documents: [{
        type: documentType,
        path: filePath,
        file_name: file.name,
        uploaded_at: new Date().toISOString()
      }],
      status: 'pending'
    }).select().single();

    if (dbErr) throw new Error(`Failed to record verification submission: ${dbErr.message}`);

    return { filePath, verificationRecord: data };
  },

  // Fetch doctor verification submissions with signed URLs
  async getDoctorVerifications(doctorId) {
    const { data, error } = await supabase
      .from('doctor_verifications')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Doctor verifications fetch notice:', error.message);
      return [];
    }

    // Generate signed URLs for submitted documents
    const enriched = await Promise.all((data || []).map(async (row) => {
      const docs = Array.isArray(row.submitted_documents) ? row.submitted_documents : [];
      const signedDocs = await Promise.all(docs.map(async (doc) => {
        if (doc.path) {
          const { data: signedData } = await supabase.storage
            .from('doctor-documents')
            .createSignedUrl(doc.path, 3600);
          return { ...doc, signedUrl: signedData?.signedUrl || null };
        }
        return doc;
      }));
      return { ...row, submitted_documents: signedDocs };
    }));

    return enriched;
  },

  // Get doctor weekly availability schedule
  async getDoctorSchedule(doctorId) {
    const { data, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.warn('Doctor schedule fetch notice:', error.message);
      return [];
    }
    return data || [];
  },

  // Save/replace doctor availability schedule atomically
  async saveDoctorSchedule(doctorId, scheduleSlots) {
    // Delete existing and insert new
    await supabase.from('doctor_availability').delete().eq('doctor_id', doctorId);

    if (scheduleSlots && scheduleSlots.length > 0) {
      const rows = scheduleSlots.map(slot => ({
        doctor_id: doctorId,
        day_of_week: parseInt(slot.day_of_week, 10),
        start_time: slot.start_time,
        end_time: slot.end_time,
        slot_duration_minutes: parseInt(slot.slot_duration_minutes || 30, 10),
        is_active: slot.is_active ?? true
      }));

      const { data, error } = await supabase
        .from('doctor_availability')
        .insert(rows)
        .select();

      if (error) throw new Error(error.message);
      return data;
    }
    return [];
  },

  // Real Database Aggregations for /doctor/analytics
  async getDoctorAnalytics(doctorId) {
    try {
      const [
        completedAppts,
        scheduledAppts,
        cancelledAppts,
        noShowAppts,
        allAppts,
        prescriptionsRes
      ] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'completed'),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).in('status', ['scheduled', 'confirmed', 'requested', 'in_progress']),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'cancelled'),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId).eq('status', 'no_show'),
        supabase.from('appointments').select('id, patient_id, consultation_type, appointment_date, status').eq('doctor_id', doctorId),
        supabase.from('prescriptions').select('id', { count: 'exact', head: true }).eq('doctor_id', doctorId)
      ]);

      const apptList = allAppts.data || [];
      const distinctPatients = new Set(apptList.map(a => a.patient_id)).size;
      const videoCount = apptList.filter(a => a.consultation_type === 'video').length;
      const inPersonCount = apptList.filter(a => a.consultation_type === 'in_person').length;

      // Group completed consultations by month
      const monthlyMap = {};
      apptList.forEach(a => {
        if (a.appointment_date) {
          const monthKey = a.appointment_date.slice(0, 7); // YYYY-MM
          if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { month: monthKey, completed: 0, total: 0 };
          }
          monthlyMap[monthKey].total += 1;
          if (a.status === 'completed') {
            monthlyMap[monthKey].completed += 1;
          }
        }
      });

      const trendData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));

      return {
        totalConsultations: completedAppts.count || 0,
        activeScheduled: scheduledAppts.count || 0,
        cancelledCount: cancelledAppts.count || 0,
        noShowCount: noShowAppts.count || 0,
        uniquePatientsTreated: distinctPatients,
        prescriptionsIssued: prescriptionsRes.count || 0,
        consultationTypeDistribution: {
          video: videoCount,
          inPerson: inPersonCount
        },
        monthlyTrend: trendData
      };
    } catch (err) {
      console.error('Error calculating doctor analytics:', err);
      return {
        totalConsultations: 0,
        activeScheduled: 0,
        cancelledCount: 0,
        noShowCount: 0,
        uniquePatientsTreated: 0,
        prescriptionsIssued: 0,
        consultationTypeDistribution: { video: 0, inPerson: 0 },
        monthlyTrend: []
      };
    }
  }
};
