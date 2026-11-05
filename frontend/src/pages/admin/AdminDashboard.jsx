import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Stethoscope,
  Store,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Activity,
  DollarSign,
  TrendingUp,
  Clock,
  RefreshCw,
  Bell,
  Settings,
  Lock,
  Zap,
  CheckCircle2,
  XCircle,
  UserCheck
} from 'lucide-react';

export default function AdminDashboard() {
  const [kpis, setKpis] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    pendingDoctors: 0,
    approvedDoctors: 0,
    totalPharmacies: 0,
    pendingPharmacies: 0,
    approvedPharmacies: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    aiCallsToday: 0,
    highRiskTriages: 0,
    rateLimitBlocks: 0
  });
  const [health, setHealth] = useState({
    database: { status: 'healthy', latencyMs: 25 },
    mlService: { status: 'offline', latencyMs: 0 },
    reportIntelligence: { status: 'offline' },
    storage: { status: 'healthy' }
  });
  const [recentAudits, setRecentAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(true);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      const [kpiData, healthData, auditData] = await Promise.all([
        adminService.getSystemKPIs().catch(() => null),
        adminService.getSystemHealth().catch(() => null),
        adminService.getAuditLogs({ limit: 5 }).catch(() => ({ logs: [] }))
      ]);
      if (kpiData) setKpis(kpiData);
      if (healthData) setHealth(healthData);
      if (auditData?.logs) setRecentAudits(auditData.logs);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const pendingTotal = (kpis?.pendingDoctors || 0) + (kpis?.pendingPharmacies || 0);

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#eff6ff', borderRadius: '6px', color: '#0a4bb5', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ShieldCheck size={16} /> Admin Governance Platform
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px', letterSpacing: '-0.02em' }}>
            Executive Platform Dashboard
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Unified administrative command across patient services, clinical verifications, pharmacy dispensaries, and HIPAA audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: health?.database?.status === 'healthy' ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
            <span style={{ fontWeight: '600', color: '#475569' }}>Cluster: Live Supabase</span>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>({health?.database?.latencyMs || 0}ms)</span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Mandatory Verification Gate Banner */}
      {pendingTotal > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '18px 24px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ background: '#d97706', color: '#ffffff', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#92400e' }}>
                Pending Regulatory Credential Approvals ({pendingTotal})
              </h3>
              <p style={{ fontSize: '13px', color: '#b45309', marginTop: '2px' }}>
                <strong>{kpis?.pendingDoctors || 0} Doctor(s)</strong> and <strong>{kpis?.pendingPharmacies || 0} Pharmacy(s)</strong> are awaiting credential verification. Practitioners cannot practice until verified by an Administrator.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {kpis?.pendingDoctors > 0 && (
              <Link
                to="/admin/doctor-verification"
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Stethoscope size={15} /> Verify Doctors ({kpis.pendingDoctors})
              </Link>
            )}
            {kpis?.pendingPharmacies > 0 && (
              <Link
                to="/admin/pharmacy-verification"
                style={{
                  background: '#b45309',
                  color: '#ffffff',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Store size={15} /> Verify Pharmacies ({kpis.pendingPharmacies})
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {/* Patients */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Total Patients</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#f5f3ff', color: '#7c3aed' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
            {kpis?.totalPatients || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Registered clinical profiles
          </div>
        </div>

        {/* Doctors */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Medical Practitioners</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb' }}>
              <Stethoscope size={18} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
            {kpis?.totalDoctors || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', fontWeight: '600', display: 'flex', gap: '8px' }}>
            <span>{kpis?.approvedDoctors || 0} Approved</span>
            <span style={{ color: '#d97706' }}>{kpis?.pendingDoctors || 0} Pending</span>
          </div>
        </div>

        {/* Pharmacies */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Dispensaries</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a' }}>
              <Store size={18} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
            {kpis?.totalPharmacies || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', fontWeight: '600', display: 'flex', gap: '8px' }}>
            <span>{kpis?.approvedPharmacies || 0} Verified</span>
            <span style={{ color: '#d97706' }}>{kpis?.pendingPharmacies || 0} Pending</span>
          </div>
        </div>

        {/* Appointments */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Consultations</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#fef3c7', color: '#d97706' }}>
              <Activity size={18} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
            {kpis?.totalAppointments || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            {kpis?.completedAppointments || 0} completed encounters
          </div>
        </div>

        {/* Marketplace Orders & Revenue */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Marketplace Volume</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', marginTop: '12px' }}>
            ₹{(kpis?.totalRevenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
            Across {kpis?.totalOrders || 0} prescription orders
          </div>
        </div>

        {/* AI & Security Telemetry */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>AI Triage & Security</span>
            <div style={{ padding: '8px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626' }}>
              <Zap size={18} />
            </div>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a', marginTop: '12px' }}>
            {kpis?.aiCallsToday || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', display: 'flex', gap: '8px' }}>
            <span>{kpis?.highRiskTriages || 0} High-risk</span>
            <span style={{ color: '#dc2626', fontWeight: '600' }}>{kpis?.rateLimitBlocks || 0} Blocks</span>
          </div>
        </div>
      </div>

      {/* Governance & Operations Modules Grid */}
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
        Administrative Governance Modules
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {[
          {
            title: 'User Governance',
            desc: 'Manage all accounts, suspend/reactivate profiles',
            path: '/admin/users',
            icon: Users,
            color: '#2563eb',
            bg: '#eff6ff'
          },
          {
            title: 'Patient Directory',
            desc: 'Demographics, registrations & care summaries',
            path: '/admin/patients',
            icon: UserCheck,
            color: '#7c3aed',
            bg: '#f5f3ff'
          },
          {
            title: 'Doctor Directory',
            desc: 'Practitioner list, specialties & clinic fees',
            path: '/admin/doctors',
            icon: Stethoscope,
            color: '#0284c7',
            bg: '#f0f9ff'
          },
          {
            title: 'Pharmacy Directory',
            desc: 'Dispensaries, 24x7 status & licensed stores',
            path: '/admin/pharmacies',
            icon: Store,
            color: '#059669',
            bg: '#ecfdf5'
          },
          {
            title: 'Doctor Verification',
            desc: 'Credential review & verify_doctor_tx RPC',
            path: '/admin/doctor-verification',
            icon: ShieldCheck,
            color: '#d97706',
            bg: '#fffbeb',
            badge: kpis?.pendingDoctors > 0 ? `${kpis.pendingDoctors} Pending` : null
          },
          {
            title: 'Pharmacy Verification',
            desc: 'Drug license review & verify_pharmacy_tx RPC',
            path: '/admin/pharmacy-verification',
            icon: CheckCircle2,
            color: '#16a34a',
            bg: '#f0fdf4',
            badge: kpis?.pendingPharmacies > 0 ? `${kpis.pendingPharmacies} Pending` : null
          },
          {
            title: 'Role Governance',
            desc: 'RBAC user_roles governance & escalation blocks',
            path: '/admin/roles',
            icon: Lock,
            color: '#9333ea',
            bg: '#faf5ff'
          },
          {
            title: 'Audit & Compliance',
            desc: 'Immutable HIPAA & ABDM event logs',
            path: '/admin/audit-logs',
            icon: FileText,
            color: '#475569',
            bg: '#f1f5f9'
          },
          {
            title: 'Platform Analytics',
            desc: 'Consultation & prescription order trend charts',
            path: '/admin/analytics',
            icon: TrendingUp,
            color: '#0891b2',
            bg: '#ecfeff'
          },
          {
            title: 'AI Telemetry & Quota',
            desc: 'Gemini 1.5 Pro and Random Forest metrics',
            path: '/admin/ai-usage',
            icon: Zap,
            color: '#ea580c',
            bg: '#fff7ed'
          },
          {
            title: 'Security Monitoring',
            desc: 'Rate-limit blocks, threat logs & user suspensions',
            path: '/admin/security',
            icon: AlertTriangle,
            color: '#dc2626',
            bg: '#fef2f2'
          },
          {
            title: 'Notification Broadcast',
            desc: 'Platform announcements & targeted alerts',
            path: '/admin/notifications',
            icon: Bell,
            color: '#4f46e5',
            bg: '#eef2ff'
          },
          {
            title: 'System Settings',
            desc: 'Microservice latency, maintenance & parameters',
            path: '/admin/settings',
            icon: Settings,
            color: '#334155',
            bg: '#f8fafc'
          }
        ].map(mod => {
          const Icon = mod.icon;
          return (
            <Link
              key={mod.path}
              to={mod.path}
              style={{
                background: '#ffffff',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#93c5fd';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(10, 75, 181, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ padding: '10px', background: mod.bg, color: mod.color, borderRadius: '10px' }}>
                  <Icon size={22} />
                </div>
                {mod.badge && (
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 8px', background: '#fef3c7', color: '#b45309', borderRadius: '12px' }}>
                    {mod.badge}
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                {mod.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                {mod.desc}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0a4bb5', fontSize: '12px', fontWeight: '700', marginTop: '12px' }}>
                Access Module <ArrowRight size={12} />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Audit Trail Preview */}
      <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              Recent Administrative Audit Events
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Real-time audit log stream captured under HIPAA least-privilege policies.
            </p>
          </div>
          <Link to="/admin/audit-logs" style={{ fontSize: '13px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View Full Audit Trail <ArrowRight size={14} />
          </Link>
        </div>

        {recentAudits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>
            No recent administrative audit events recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Action</th>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Entity</th>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Actor</th>
                  <th style={{ padding: '10px 12px', fontWeight: '600' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {recentAudits.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '10px 12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        background: item.action?.includes('APPROVE') ? '#dcfce7' : (item.action?.includes('REJECT') || item.action?.includes('SUSPEND') ? '#fee2e2' : '#f1f5f9'),
                        color: item.action?.includes('APPROVE') ? '#15803d' : (item.action?.includes('REJECT') || item.action?.includes('SUSPEND') ? '#b91c1c' : '#334155')
                      }}>
                        {item.action}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>
                      {item.target_entity || item.resource_type || '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#64748b' }}>
                      {item.actor_role || item.user_role || 'admin'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#475569', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof item.details === 'object' ? JSON.stringify(item.details) : (item.details || '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
