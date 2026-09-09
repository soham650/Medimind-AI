import { supabase } from '../lib/supabaseClient';

/**
 * Production Prescription Service
 * Issues digital prescriptions with item lines atomically via create_prescription_tx RPC.
 * Integrates with medication_schedules and preserves tamper-evident clinical integrity.
 */
export const prescriptionService = {
  // Issue a new digital prescription atomically via Migration 0009 RPC
  async createPrescription({
    doctorId,
    patientId,
    consultationId = null,
    diagnosis,
    medicines = [],
    generalAdvice = '',
    createSchedules = false
  }) {
    // Resolve doctor ID from auth if not explicitly provided
    let effectiveDocId = doctorId;
    if (!effectiveDocId) {
      const { data: authData } = await supabase.auth.getUser();
      effectiveDocId = authData?.user?.id;
    }

    if (!effectiveDocId) {
      throw new Error('Authenticated prescribing doctor session is required.');
    }

    // Format items JSONB array matching create_prescription_tx expected schema
    const formattedItems = (medicines || []).map(m => ({
      name: m.name || m.medicine_name || 'Generic Medication',
      medicine_name: m.name || m.medicine_name || 'Generic Medication',
      dosage: m.dosage || 'As directed',
      frequency: m.frequency || '1-0-1',
      duration_days: parseInt(m.duration || m.duration_days || 7, 10) || 7,
      instructions: m.instructions || 'Take after meals with water'
    }));

    const { data, error } = await supabase.rpc('create_prescription_tx', {
      p_doctor_id: effectiveDocId,
      p_patient_id: patientId,
      p_appointment_id: consultationId || null,
      p_diagnosis: diagnosis,
      p_advice: generalAdvice || '',
      p_medicines: formattedItems
    });

    if (error) throw new Error(error.message);

    // If requested, populate patient's daily medication intake schedules
    if (createSchedules && data?.prescription_id) {
      try {
        await this.createMedicationSchedules(patientId, data.prescription_id, formattedItems);
      } catch (schedErr) {
        console.warn('Medication schedule auto-generation notice:', schedErr.message);
      }
    }

    return data;
  },

  // Create medication schedule records for patient daily intake tracking
  async createMedicationSchedules(patientId, prescriptionId, items = []) {
    const today = new Date().toISOString().split('T')[0];
    const rows = [];
    items.forEach(item => {
      const freq = item.frequency || '1-0-1';
      // Map common frequencies to time of day slots
      if (freq.includes('1-0-0') || freq.toLowerCase().includes('morn') || freq.includes('1-0-1') || freq.includes('1-1-1')) {
        rows.push({
          patient_id: patientId,
          prescription_id: prescriptionId,
          medicine_name: item.name || item.medicine_name,
          dosage: item.dosage,
          time_of_day: 'Morning',
          scheduled_date: today,
          taken: false
        });
      }
      if (freq.includes('0-1-0') || freq.toLowerCase().includes('afternoon') || freq.includes('1-1-1')) {
        rows.push({
          patient_id: patientId,
          prescription_id: prescriptionId,
          medicine_name: item.name || item.medicine_name,
          dosage: item.dosage,
          time_of_day: 'Afternoon',
          scheduled_date: today,
          taken: false
        });
      }
      if (freq.includes('0-0-1') || freq.toLowerCase().includes('night') || freq.includes('1-0-1') || freq.includes('1-1-1')) {
        rows.push({
          patient_id: patientId,
          prescription_id: prescriptionId,
          medicine_name: item.name || item.medicine_name,
          dosage: item.dosage,
          time_of_day: 'Night',
          scheduled_date: today,
          taken: false
        });
      }
    });

    if (rows.length > 0) {
      const { data, error } = await supabase.from('medication_schedules').insert(rows).select();
      if (error) throw error;
      return data;
    }
    return [];
  },

  // Get patient prescriptions with joined line items and doctor info
  async getPatientPrescriptions(patientId) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        id,
        rx_id,
        diagnosis,
        notes,
        created_at,
        doctor:doctor_id (
          id,
          full_name,
          specialization,
          license_number,
          clinic_name
        ),
        prescription_items (
          id,
          medicine_name,
          dosage,
          frequency,
          duration_days,
          instructions
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Format medicines array to seamlessly match UI components
    return (data || []).map(p => ({
      ...p,
      general_advice: p.notes,
      medicines: (p.prescription_items || []).map(item => ({
        name: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration_days ? `${item.duration_days} Days` : '7 Days',
        instructions: item.instructions
      }))
    }));
  },

  // Get doctor's issued prescriptions list
  async getDoctorPrescriptions(doctorId) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        id,
        rx_id,
        diagnosis,
        notes,
        created_at,
        patient:patient_id (
          id,
          full_name,
          phone,
          abha_id
        ),
        prescription_items (
          id,
          medicine_name,
          dosage,
          frequency,
          duration_days,
          instructions
        )
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map(p => ({
      ...p,
      general_advice: p.notes,
      medicines: (p.prescription_items || []).map(item => ({
        name: item.medicine_name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration_days ? `${item.duration_days} Days` : '7 Days',
        instructions: item.instructions
      }))
    }));
  },

  // Lookup single prescription by Rx ID (Used by Pharmacies)
  async getPrescriptionByRxId(rxId) {
    const { data, error } = await supabase
      .from('prescriptions')
      .select(`
        id,
        rx_id,
        diagnosis,
        notes,
        created_at,
        patient:patient_id (
          full_name,
          phone
        ),
        doctor:doctor_id (
          full_name,
          specialization,
          license_number
        ),
        prescription_items (*)
      `)
      .eq('rx_id', rxId.trim().toUpperCase())
      .single();

    if (error) throw new Error('Prescription not found or invalid Rx ID.');
    return {
      ...data,
      general_advice: data.notes
    };
  },

  // Get patient's daily medication schedule
  async getDailyDoseSchedule(patientId) {
    try {
      const { data, error } = await supabase
        .from('medication_schedules')
        .select('*')
        .eq('patient_id', patientId)
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('prescriptionService.getDailyDoseSchedule notice:', err.message);
      return [];
    }
  },

  // Log dose taken / skipped via RPC
  async logDoseStatus(scheduleId, status) {
    try {
      const { data, error } = await supabase.rpc('log_medication_dose_tx', {
        p_schedule_id: scheduleId,
        p_status: status
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('RPC log_medication_dose_tx notice:', err.message);
      const { data: updated, error: upErr } = await supabase
        .from('medication_schedules')
        .update({
          status,
          taken_at: status === 'taken' ? new Date().toISOString() : null
        })
        .eq('id', scheduleId)
        .select()
        .single();
      if (upErr) throw upErr;
      return updated;
    }
  }
};
