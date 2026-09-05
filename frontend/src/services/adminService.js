import { supabase } from '../lib/supabaseClient';

/**
 * Super Admin Service (Additional Control & Mandatory Approval Gate)
 * Provides Doctor Verification, Pharmacy Verification, User Management,
 * Master Data, and HIPAA-compliant Audit Logs.
 */
export const adminService = {
  // 12. Doctor Verification: Fetch doctors pending admin review
  async getDoctorApplications(status = 'pending') {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'doctor');

    if (status !== 'all') {
      query = query.eq('approval_status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 13. Pharmacy Verification: Fetch pharmacies pending admin review
  async getPharmacyApplications(status = 'pending') {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'pharmacy');

    if (status !== 'all') {
      query = query.eq('approval_status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Approve or Reject an entity (Doctor or Pharmacy)
  async updateApprovalStatus(profileId, newStatus, reason = '') {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        approval_status: newStatus,
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;

    // Log the action to audit_logs
    await this.logAction({
      action: newStatus === 'approved' ? 'ENTITY_APPROVED' : 'ENTITY_REJECTED',
      resource_type: data.role,
      resource_id: profileId,
      details: { role: data.role, status: newStatus, reason }
    });

    return data;
  },

  // 11. User Management: Get all users across roles
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // 9. Audit & Logging Service: Log an action
  async logAction({ user_id = null, user_email = 'system', user_role = 'admin', action, resource_type, resource_id = null, details = {} }) {
    try {
      await supabase.from('audit_logs').insert({
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        details
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  },

  // Retrieve audit logs
  async getAuditLogs(limit = 50) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Could not load audit logs:', error.message);
      return [];
    }
    return data || [];
  }
};
