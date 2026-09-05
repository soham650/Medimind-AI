import { supabase } from '../lib/supabaseClient';

/**
 * Production Health Report & Storage Service
 * Encrypted private storage bucket 'medical-documents' with signed URLs.
 */
export const reportService = {
  // Upload report file to private storage and insert metadata
  async uploadReport(patientId, file, reportTitle, aiAnalysis = {}) {
    // 1. Sanitize file name and path
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const storagePath = `${patientId}/${cleanFileName}`;

    // 2. Upload to private bucket
    const { error: uploadError } = await supabase.storage
      .from('medical-documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    // 3. Insert metadata record in health_reports
    const { data: record, error: dbError } = await supabase
      .from('health_reports')
      .insert({
        patient_id: patientId,
        report_title: reportTitle || file.name,
        storage_path: storagePath,
        mime_type: file.type || 'application/pdf',
        file_size_bytes: file.size,
        ai_analysis: aiAnalysis
      })
      .select()
      .single();

    if (dbError) throw new Error(`Database record failed: ${dbError.message}`);
    return record;
  },

  // Fetch patient reports list
  async getReports(patientId) {
    const { data, error } = await supabase
      .from('health_reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  },

  // Generate temporary private signed URL
  async getSignedUrl(storagePath, expiresInSeconds = 300) {
    const { data, error } = await supabase.storage
      .from('medical-documents')
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error) throw new Error(error.message);
    return data.signedUrl;
  },

  // Delete report
  async deleteReport(reportId, storagePath) {
    await supabase.storage.from('medical-documents').remove([storagePath]);
    const { error } = await supabase.from('health_reports').delete().eq('id', reportId);
    if (error) throw new Error(error.message);
  }
};
