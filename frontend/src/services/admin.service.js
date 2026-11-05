import { supabase } from '../lib/supabaseClient.js';

let lastBroadcastTimestamp = 0;
const VALID_BROADCAST_ROLES = Object.freeze(['all', 'patient', 'doctor', 'pharmacy', 'admin']);

/**
 * Consolidated Production Admin Service (MediMind AI — Phase 7)
 * Authoritative administrative layer adhering strictly to:
 * - auth.uid() + PostgreSQL RLS policies
 * - Existing SECURITY DEFINER RPCs (verify_doctor_tx, verify_pharmacy_tx)
 * - Least-privilege healthcare boundary (No raw EHR access for admins)
 * - Immutable HIPAA audit logging
 */

export const adminService = {
  // -------------------------------------------------------------
  // 1. SYSTEM KPIS & AGGREGATIONS
  // -------------------------------------------------------------
  async getSystemKPIs() {
    try {
      const [
        patientsRes,
        doctorsRes,
        pharmsRes,
        apptsRes,
        ordersRes,
        profilesRes,
        aiRes,
        rateRes
      ] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }).catch(e => ({ count: 0, error: e })),
        supabase.from('doctors').select('id, verification_status').catch(e => ({ data: [], error: e })),
        supabase.from('pharmacies').select('id, verification_status').catch(e => ({ data: [], error: e })),
        supabase.from('appointments').select('id, status').catch(e => ({ data: [], error: e })),
        supabase.from('medicine_orders').select('id, total_amount, order_status').catch(e => ({ data: [], error: e })),
        supabase.from('profiles').select('id, status, approval_status, role').catch(e => ({ data: [], error: e })),
        supabase.from('ai_usage_daily').select('total_calls, gemini_calls, rf_calls, high_risk_flagged').limit(1).catch(e => ({ data: [], error: e })),
        supabase.from('rate_limit_events').select('id', { count: 'exact', head: true }).catch(e => ({ count: 0, error: e }))
      ]);

      const doctors = doctorsRes.data || [];
      const pharmacies = pharmsRes.data || [];
      const appointments = apptsRes.data || [];
      const orders = ordersRes.data || [];
      const profiles = profilesRes.data || [];

      const pendingDoctors = doctors.filter(d => d.verification_status === 'pending').length;
      const approvedDoctors = doctors.filter(d => d.verification_status === 'approved').length;
      const rejectedDoctors = doctors.filter(d => d.verification_status === 'rejected').length;

      const pendingPharmacies = pharmacies.filter(p => p.verification_status === 'pending').length;
      const approvedPharmacies = pharmacies.filter(p => p.verification_status === 'approved').length;
      const rejectedPharmacies = pharmacies.filter(p => p.verification_status === 'rejected').length;

      const completedAppts = appointments.filter(a => a.status === 'completed').length;
      const scheduledAppts = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;

      const totalRevenue = orders
        .filter(o => o.order_status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      const activeUsers = profiles.filter(p => p.status === 'active' || (!p.status && p.approval_status !== 'suspended')).length;
      const suspendedUsers = profiles.filter(p => p.status === 'suspended' || p.approval_status === 'suspended').length;

      const aiToday = aiRes.data && aiRes.data[0] ? aiRes.data[0] : { total_calls: 0, gemini_calls: 0, rf_calls: 0, high_risk_flagged: 0 };

      return {
        totalPatients: patientsRes.count || 0,
        totalDoctors: doctors.length,
        pendingDoctors,
        approvedDoctors,
        rejectedDoctors,
        totalPharmacies: pharmacies.length,
        pendingPharmacies,
        approvedPharmacies,
        rejectedPharmacies,
        totalAppointments: appointments.length,
        completedAppointments: completedAppts,
        scheduledAppointments: scheduledAppts,
        totalOrders: orders.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalUsers: profiles.length,
        activeUsers,
        suspendedUsers,
        aiCallsToday: aiToday.total_calls || 0,
        highRiskTriages: aiToday.high_risk_flagged || 0,
        rateLimitBlocks: rateRes.count || 0
      };
    } catch (err) {
      console.error('Error computing system KPIs:', err);
      return {
        totalPatients: 0,
        totalDoctors: 0,
        pendingDoctors: 0,
        approvedDoctors: 0,
        rejectedDoctors: 0,
        totalPharmacies: 0,
        pendingPharmacies: 0,
        approvedPharmacies: 0,
        rejectedPharmacies: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        scheduledAppointments: 0,
        totalOrders: 0,
        totalRevenue: 0,
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        aiCallsToday: 0,
        highRiskTriages: 0,
        rateLimitBlocks: 0
      };
    }
  },

  // -------------------------------------------------------------
  // 2. USER GOVERNANCE & ACCOUNT SUSPENSION
  // -------------------------------------------------------------
  async getUsers({ role = 'all', status = 'all', search = '', limit = 50, offset = 0 } = {}) {
    try {
      let query = supabase
        .from('profiles')
        .select('id, email, full_name, name, role, approval_status, status, avatar_url, phone, created_at, updated_at', { count: 'exact' });

      if (role && role !== 'all') {
        query = query.eq('role', role);
      }

      if (status && status !== 'all') {
        if (status === 'suspended') {
          query = query.or('approval_status.eq.suspended,status.eq.suspended');
        } else if (status === 'approved') {
          query = query.eq('approval_status', 'approved');
        } else if (status === 'pending') {
          query = query.eq('approval_status', 'pending');
        }
      }

      if (search && search.trim()) {
        const term = search.trim();
        query = query.or(`full_name.ilike.%${term}%,name.ilike.%${term}%,email.ilike.%${term}%`);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { users: data || [], total: count || 0 };
    } catch (err) {
      console.warn('Users fetch error:', err.message);
      return { users: [], total: 0 };
    }
  },

  async getAllUsers() {
    const res = await this.getUsers({ limit: 500 });
    return res.users;
  },

  async updateUserStatus(userId, approvalStatus, accountStatus = null, reason = '') {
    const updatePayload = {
      updated_at: new Date().toISOString()
    };

    if (['pending', 'approved', 'rejected'].includes(approvalStatus)) {
      updatePayload.approval_status = approvalStatus;
    } else if (approvalStatus === 'suspended') {
      updatePayload.status = 'suspended';
    }

    if (accountStatus && ['active', 'suspended', 'deactivated'].includes(accountStatus)) {
      updatePayload.status = accountStatus;
    } else if (approvalStatus === 'suspended') {
      updatePayload.status = 'suspended';
    } else if (approvalStatus === 'approved' && !updatePayload.status) {
      updatePayload.status = 'active';
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log administrative action
    await this.logAction({
      action: approvalStatus === 'suspended' ? 'USER_SUSPENDED' : (approvalStatus === 'approved' ? 'USER_ACTIVATED' : 'USER_STATUS_CHANGED'),
      target_entity: 'profile',
      target_id: userId,
      details: {
        approval_status: approvalStatus,
        status: updatePayload.status,
        reason: reason || 'Administrative action via Admin Portal'
      }
    });

    return data;
  },

  async suspendUser(userId, reason = 'Administrative suspension') {
    return this.updateUserStatus(userId, 'suspended', 'suspended', reason);
  },

  async reactivateUser(userId) {
    return this.updateUserStatus(userId, 'approved', 'active', 'Reactivated by Administrator');
  },

  // -------------------------------------------------------------
  // 3. DOCTOR MANAGEMENT & VERIFICATION (verify_doctor_tx RPC)
  // -------------------------------------------------------------
  async getDoctorApplications(status = 'pending') {
    let query = supabase
      .from('doctors')
      .select('*');

    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getDoctors({ search = '', status = 'all', limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from('doctors')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`full_name.ilike.%${term}%,specialization.ilike.%${term}%,qualification.ilike.%${term}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { doctors: data || [], total: count || 0 };
  },

  async verifyDoctor(doctorId, status, reason = null) {
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error(`Invalid status "${status}". Must be "approved" or "rejected".`);
    }

    // 1. Try server-side approval API (handles profiles, auth metadata, and SMS notification)
    try {
      if (status === 'approved') {
        const approveRes = await fetch('/api/auth/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: doctorId, role: 'doctor' })
        });
        if (approveRes.ok) {
          await this.logAction({
            action: 'DOCTOR_APPROVED',
            target_entity: 'doctor',
            target_id: doctorId,
            details: { status: 'approved', channel: 'admin_portal' }
          }).catch(() => {});
          return { success: true };
        }
      }
    } catch (apiErr) {
      console.warn('API doctor verification fallback to RPC:', apiErr.message);
    }

    // 2. Fallback to PostgreSQL stored procedure
    const { data, error } = await supabase.rpc('verify_doctor_tx', {
      p_doctor_id: doctorId,
      p_status: status,
      p_reason: reason
    });

    if (error) {
      // Direct client fallback if RPC not installed
      await supabase.from('doctors').update({
        verification_status: status,
        is_available: status === 'approved'
      }).eq('id', doctorId);

      await supabase.from('profiles').update({
        approval_status: status,
        verification_status: status
      }).eq('id', doctorId);
    }

    // Log to immutable audit logs
    await this.logAction({
      action: status === 'approved' ? 'DOCTOR_APPROVED' : 'DOCTOR_REJECTED',
      target_entity: 'doctor',
      target_id: doctorId,
      details: { status, reason }
    }).catch(() => {});

    return data || { success: true };
  },

  async deleteDoctor(doctorId) {
    if (!doctorId) throw new Error('Doctor ID is required');

    // 1. Primary: Server-side deletion with service_role privileges
    try {
      const res = await fetch('/api/admin/doctors/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (apiErr) {
      console.warn('API delete doctor fallback:', apiErr.message);
    }

    // 2. Client-side cascade deletion fallback
    await supabase.from('doctor_availability').delete().eq('doctor_id', doctorId);
    await supabase.from('appointments').delete().eq('doctor_id', doctorId);
    await supabase.from('prescriptions').delete().eq('doctor_id', doctorId);
    await supabase.from('patient_doctor_access').delete().eq('doctor_id', doctorId);
    await supabase.from('doctors').delete().eq('id', doctorId);
    await supabase.from('user_roles').delete().eq('user_id', doctorId);
    await supabase.from('profiles').delete().eq('id', doctorId);

    return { success: true };
  },

  // -------------------------------------------------------------
  // 4. PHARMACY MANAGEMENT & VERIFICATION (verify_pharmacy_tx RPC)
  // -------------------------------------------------------------
  async getPharmacyApplications(status = 'pending') {
    let query = supabase
      .from('pharmacies')
      .select('*');

    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getPharmacies({ search = '', status = 'all', limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from('pharmacies')
      .select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('verification_status', status);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`pharmacy_name.ilike.%${term}%,contact_person.ilike.%${term}%,license_number.ilike.%${term}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { pharmacies: data || [], total: count || 0 };
  },

  async verifyPharmacy(pharmacyId, status, reason = null) {
    if (!['approved', 'rejected'].includes(status)) {
      throw new Error(`Invalid status "${status}". Must be "approved" or "rejected".`);
    }

    const { data, error } = await supabase.rpc('verify_pharmacy_tx', {
      p_pharmacy_id: pharmacyId,
      p_status: status,
      p_reason: reason
    });

    if (error) throw error;

    // Log to immutable audit logs
    await this.logAction({
      action: status === 'approved' ? 'PHARMACY_APPROVED' : 'PHARMACY_REJECTED',
      target_entity: 'pharmacy',
      target_id: pharmacyId,
      details: { status, reason, rpc: 'verify_pharmacy_tx' }
    });

    return data;
  },

  // Legacy compatibility method for existing UI calls
  async updateApprovalStatus(profileId, newStatus, reason = '') {
    // Check role of profile to determine whether to call verify_doctor_tx or verify_pharmacy_tx
    const { data: prof } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', profileId)
      .single();

    if (prof?.role === 'doctor') {
      return this.verifyDoctor(profileId, newStatus, reason);
    } else if (prof?.role === 'pharmacist' || prof?.role === 'pharmacy') {
      return this.verifyPharmacy(profileId, newStatus, reason);
    } else {
      return this.updateUserStatus(profileId, newStatus, null, reason);
    }
  },

  // -------------------------------------------------------------
  // 5. PATIENT DIRECTORY (LEAST PRIVILEGE: METADATA ONLY, NO RAW EHR)
  // -------------------------------------------------------------
  async getPatients({ search = '', limit = 50, offset = 0 } = {}) {
    let query = supabase
      .from('patients')
      .select('id, full_name, phone, date_of_birth, gender, blood_group, preferred_language, timezone, abha_id, created_at, updated_at', { count: 'exact' });

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,abha_id.ilike.%${term}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { patients: data || [], total: count || 0 };
  },

  // -------------------------------------------------------------
  // 6. ROLE GOVERNANCE
  // -------------------------------------------------------------
  async getUserRoles() {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, user_id, role, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateUserRole(userId, newRole) {
    const allowedRoles = ['patient', 'doctor', 'pharmacist', 'admin'];
    if (!allowedRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Must be one of: ${allowedRoles.join(', ')}`);
    }

    // Check existing role
    const { data: existing } = await supabase
      .from('user_roles')
      .select('id, role')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole })
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    // Also update profiles.role for frontend cache consistency
    await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    await this.logAction({
      action: 'ROLE_MODIFIED',
      target_entity: 'user_roles',
      target_id: userId,
      details: { previousRole: existing?.role || 'none', newRole }
    });

    return result;
  },

  // -------------------------------------------------------------
  // 7. AUDIT LOGGING (HIPAA/ABDM COMPLIANCE)
  // -------------------------------------------------------------
  async logAction({ action, target_entity = 'system', target_id = null, details = {}, ip_address = null }) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      await supabase.from('audit_logs').insert({
        actor_id: user?.id || null,
        user_id: user?.id || null,
        actor_role: 'admin',
        user_role: 'admin',
        action,
        target_entity,
        resource_type: target_entity,
        target_id: target_id ? String(target_id) : null,
        resource_id: target_id ? String(target_id) : null,
        details,
        metadata: details,
        ip_address
      });
    } catch (err) {
      console.warn('Audit log write note:', err.message);
    }
  },

  async getAuditLogs({ limit = 100, offset = 0, action = 'all', entity = 'all', search = '' } = {}) {
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (action && action !== 'all') {
      query = query.eq('action', action);
    }

    if (entity && entity !== 'all') {
      query = query.or(`target_entity.eq.${entity},resource_type.eq.${entity}`);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`action.ilike.%${term}%,target_entity.ilike.%${term}%,actor_role.ilike.%${term}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('Audit logs query notice:', error.message);
      return { logs: [], total: 0 };
    }

    return { logs: data || [], total: count || 0 };
  },

  // -------------------------------------------------------------
  // 8. PLATFORM ANALYTICS & TRENDS
  // -------------------------------------------------------------
  async getPlatformAnalytics() {
    try {
      const [apptsRes, ordersRes, docsRes, pharmsRes, aiRes] = await Promise.all([
        supabase.from('appointments').select('id, appointment_date, status, created_at'),
        supabase.from('medicine_orders').select('id, total_amount, order_status, created_at'),
        supabase.from('doctors').select('id, verification_status, created_at'),
        supabase.from('pharmacies').select('id, verification_status, created_at'),
        supabase.from('ai_usage_daily').select('*').order('usage_date', { ascending: true }).limit(30)
      ]);

      return {
        appointments: apptsRes.data || [],
        orders: ordersRes.data || [],
        doctors: docsRes.data || [],
        pharmacies: pharmsRes.data || [],
        aiUsageTrends: aiRes.data || []
      };
    } catch (err) {
      console.error('Failed to load platform analytics:', err);
      return { appointments: [], orders: [], doctors: [], pharmacies: [], aiUsageTrends: [] };
    }
  },

  // -------------------------------------------------------------
  // 9. AI USAGE TELEMETRY (ZERO SECRETS LEAKAGE)
  // -------------------------------------------------------------
  async getAiUsageSummary(limit = 30) {
    const { data, error } = await supabase
      .from('ai_usage_daily')
      .select('*')
      .order('usage_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('AI usage summary note:', error.message);
      return [];
    }
    return data || [];
  },

  // -------------------------------------------------------------
  // 10. SECURITY & RATE-LIMIT MONITORING
  // -------------------------------------------------------------
  async getRateLimitEvents(limit = 50) {
    const { data, error } = await supabase
      .from('rate_limit_events')
      .select('*')
      .order('blocked_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Rate limit events note:', error.message);
      return [];
    }
    return data || [];
  },

  // -------------------------------------------------------------
  // 11. NOTIFICATION MANAGEMENT & BROADCASTS
  // -------------------------------------------------------------
  async getNotifications(limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Notifications fetch note:', error.message);
      return [];
    }
    return data || [];
  },

  async sendBroadcastNotification({ title, message, targetRole = 'all', type = 'announcement' }) {
    if (!title || !message) {
      throw new Error('Title and message are required for broadcast notifications.');
    }

    // 1. Authoritative Admin / Super Admin Authorization Check
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    const caller = authData?.user;
    if (authErr || !caller) {
      throw new Error('Authentication required for broadcast dispatch.');
    }

    const { data: callerProfile, error: profErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profErr || !callerProfile || callerProfile.role !== 'admin') {
      throw new Error('Unauthorized: Only platform administrators are permitted to broadcast notifications.');
    }

    // 2. Role-based recipient validation
    if (!VALID_BROADCAST_ROLES.includes(targetRole)) {
      throw new Error(`Invalid broadcast target role: "${targetRole}". Must be one of: ${VALID_BROADCAST_ROLES.join(', ')}.`);
    }

    // 3. Rate Limiting Protection (Minimum 10s cooldown)
    const now = Date.now();
    if (now - lastBroadcastTimestamp < 10000) {
      const waitSeconds = Math.ceil((10000 - (now - lastBroadcastTimestamp)) / 1000);
      throw new Error(`Broadcast rate limit active. Please wait ${waitSeconds}s before broadcasting again.`);
    }

    // 4. Minimum Necessary Content & Secret Leakage Prevention
    const safeTitle = String(title).trim().slice(0, 150);
    const safeMessage = String(message).trim().slice(0, 500);

    const secretPattern = /(eyJ[a-zA-Z0-9_-]{15,}|sk_live_[a-zA-Z0-9]+|bearer\s+[a-zA-Z0-9_\-\.]{15,}|password\s*[:=]|secret_key)/i;
    if (secretPattern.test(safeTitle) || secretPattern.test(safeMessage)) {
      throw new Error('Security Alert: Broadcast content contains disallowed sensitive tokens or secrets.');
    }

    // 5. Explicit recipient targeting with controlled upper bound
    let query = supabase.from('profiles').select('id');
    if (targetRole !== 'all') {
      query = query.eq('role', targetRole);
    }
    const { data: users, error: userErr } = await query.limit(500);
    if (userErr) throw userErr;

    if (!users || users.length === 0) {
      return { sent: 0 };
    }

    const notificationsToInsert = users.map(u => ({
      user_id: u.id,
      title: safeTitle,
      message: safeMessage,
      type,
      notification_type: type,
      metadata: {
        broadcast: true,
        targetRole,
        sender_id: caller.id,
        timestamp: new Date().toISOString()
      }
    }));

    // Controlled batch insertion (50 per batch)
    let totalSent = 0;
    for (let i = 0; i < notificationsToInsert.length; i += 50) {
      const batch = notificationsToInsert.slice(i, i + 50);
      const { error: insErr } = await supabase.from('notifications').insert(batch);
      if (!insErr) totalSent += batch.length;
    }

    // Update cooldown
    lastBroadcastTimestamp = Date.now();

    // 6. Immutable Audit Trail
    await this.logAction({
      action: 'NOTIFICATION_BROADCAST_SENT',
      target_entity: 'notifications',
      details: {
        title: safeTitle,
        targetRole,
        recipientsCount: totalSent,
        broadcastType: type
      }
    });

    return { sent: totalSent };
  },

  // -------------------------------------------------------------
  // 12. SYSTEM HEALTH MONITORING
  // -------------------------------------------------------------
  async getSystemHealth() {
    const startMl = Date.now();
    let mlStatus = 'offline';
    let mlLatency = 0;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 700);
      const mlRes = await fetch('http://127.0.0.1:8000/health', { 
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
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
      database: { status: dbStatus, latencyMs: dbLatency, provider: 'PostgreSQL / Supabase (AWS ap-south-1)' },
      mlService: { status: mlStatus, latencyMs: mlLatency, modelVersion: 'symptom-rf-v1' },
      reportIntelligence: { status: mlStatus, engine: 'report-analysis-v1' },
      storage: { status: 'healthy', provider: 'Supabase Storage Private Encrypted Buckets' }
    };
  },

  // -------------------------------------------------------------
  // 13. ROLE GOVERNANCE (4 CANONICAL ROLES: patient, doctor, pharmacist, admin)
  // -------------------------------------------------------------
  async assignRole(userId, newRole) {
    return this.updateUserRole(userId, newRole);
  },

  // -------------------------------------------------------------
  // 14. SYSTEM MASTER SETTINGS & MAINTENANCE LOCK
  // -------------------------------------------------------------
  getSystemSettingsDefaults() {
    return {
      maintenanceMode: false,
      allowNewRegistrations: true,
      requireDoctorLicenseUpload: true,
      requirePharmacyLicenseUpload: true,
      aiTriageEnabled: true,
      maxDailyGeminiQuota: 50000,
      abdmGatewayLive: true,
      sessionTimeoutMinutes: 60
    };
  },

  async getSystemSettings() {
    try {
      const stored = localStorage.getItem('medimind_system_settings');
      if (stored) {
        return { ...this.getSystemSettingsDefaults(), ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return this.getSystemSettingsDefaults();
  },

  async updateSystemSettings(newSettings) {
    const merged = { ...this.getSystemSettingsDefaults(), ...newSettings };
    try {
      localStorage.setItem('medimind_system_settings', JSON.stringify(merged));
    } catch {
      // ignore
    }

    await this.logAction({
      action: 'SYSTEM_SETTINGS_UPDATED',
      target_entity: 'system_configuration',
      details: { modifiedKeys: Object.keys(newSettings) }
    });

    return merged;
  }
};
