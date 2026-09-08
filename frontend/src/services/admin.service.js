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
  },

  // Governance: Multi-role user browsing without exposing PHI
  async getUsers({ role = 'all', search = '', limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, role, approval_status, avatar_url, created_at, updated_at', { count: 'exact' });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (search && search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('Users fetch notice:', error.message);
      return { users: [], total: 0 };
    }
    return { users: data || [], total: count || 0 };
  },

  // Update user status (approve, suspend, activate)
  async updateUserStatus(userId, approvalStatus) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        approval_status: approvalStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Security: Fetch rate limiting blocked events
  async getRateLimitEvents(limit = 20) {
    const { data, error } = await supabase
      .from('rate_limit_events')
      .select('*')
      .order('blocked_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Rate limit events notice:', error.message);
      return [];
    }
    return data || [];
  },

  // AI Telemetry: Daily quota & usage aggregations
  async getAiUsageSummary() {
    const { data, error } = await supabase
      .from('ai_usage_daily')
      .select('*')
      .order('usage_date', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('AI usage summary notice:', error.message);
      return [];
    }
    return data || [];
  },

  // Platform & Service Health Monitor
  async getSystemHealth() {
    const startMl = Date.now();
    let mlStatus = 'offline';
    let mlLatency = 0;

    try {
      const mlRes = await fetch('http://127.0.0.1:8000/health', { method: 'GET' });
      if (mlRes.ok) {
        mlStatus = 'healthy';
        mlLatency = Date.now() - startMl;
      }
    } catch {
      mlStatus = 'offline';
    }

    const startDb = Date.now();
    let dbStatus = 'healthy';
    let dbLatency = 0;
    try {
      await supabase.from('profiles').select('id', { count: 'exact', head: true });
      dbLatency = Date.now() - startDb;
    } catch {
      dbStatus = 'degraded';
    }

    return {
      database: { status: dbStatus, latencyMs: dbLatency },
      mlService: { status: mlStatus, latencyMs: mlLatency, modelVersion: 'symptom-rf-v1' },
      reportIntelligence: { status: mlStatus, engine: 'report-analysis-v1' },
      storage: { status: 'healthy', provider: 'Supabase Storage Private Buckets' }
    };
  }
};
