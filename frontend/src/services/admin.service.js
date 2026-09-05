import { supabase } from '../lib/supabaseClient';

/**
 * Production Super Admin Service
 * System KPIs, doctor/pharmacy verification gates, and HIPAA audit trails.
 */
export const adminService = {
  // Aggregate real system KPIs
  async getSystemKPIs() {
    try {
      const [patientsRes, doctorsRes, pharmsRes, apptsRes, ordersRes] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('doctors').select('id, verification_status'),
        supabase.from('pharmacies').select('id, verification_status'),
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('medicine_orders').select('id, total_amount, order_status')
      ]);

      const doctors = doctorsRes.data || [];
      const pharmacies = pharmsRes.data || [];
      const orders = ordersRes.data || [];

      const pendingDocs = doctors.filter(d => d.verification_status === 'pending').length;
      const approvedDocs = doctors.filter(d => d.verification_status === 'approved').length;
      const pendingPharms = pharmacies.filter(p => p.verification_status === 'pending').length;
      const approvedPharms = pharmacies.filter(p => p.verification_status === 'approved').length;

      const totalRevenue = orders
        .filter(o => o.order_status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      return {
        totalPatients: patientsRes.count || 0,
        pendingDoctors: pendingDocs,
        approvedDoctors: approvedDocs,
        pendingPharmacies: pendingPharms,
        approvedPharmacies: approvedPharms,
        totalAppointments: apptsRes.count || 0,
        totalOrders: orders.length,
        totalRevenue
      };
    } catch (err) {
      console.error('Error fetching admin KPIs:', err);
      return {
        totalPatients: 0,
        pendingDoctors: 0,
        approvedDoctors: 0,
        pendingPharmacies: 0,
        approvedPharmacies: 0,
        totalAppointments: 0,
        totalOrders: 0,
        totalRevenue: 0
      };
    }
  },

  // Doctor applications queue
  async getDoctorApplications(status = 'pending') {
    let query = supabase.from('doctors').select('*');
    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Pharmacy applications queue
  async getPharmacyApplications(status = 'pending') {
    let query = supabase.from('pharmacies').select('*');
    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Verify doctor via atomic RPC
  async verifyDoctor(doctorId, status, reason = null) {
    const { data, error } = await supabase.rpc('verify_doctor_tx', {
      p_doctor_id: doctorId,
      p_status: status,
      p_reason: reason
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // Verify pharmacy via atomic RPC
  async verifyPharmacy(pharmacyId, status, reason = null) {
    const { data, error } = await supabase.rpc('verify_pharmacy_tx', {
      p_pharmacy_id: pharmacyId,
      p_status: status,
      p_reason: reason
    });
    if (error) throw new Error(error.message);
    return data;
  },

  // Audit logs stream
  async getAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Audit logs fetch warning:', error.message);
      return [];
    }
    return data || [];
  }
};
