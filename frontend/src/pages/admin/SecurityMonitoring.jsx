import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Ban,
  Lock,
  Globe,
  Clock,
  ShieldCheck,
  UserX,
  Server
} from 'lucide-react';

export default function SecurityMonitoring() {
  const [rateLimitEvents, setRateLimitEvents] = useState([]);
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const [events, usersRes] = await Promise.all([
        adminService.getRateLimitEvents(50),
        adminService.getUsers({ status: 'suspended', limit: 50 })
      ]);
      setRateLimitEvents(events);
      setSuspendedUsers(usersRes.users || []);
    } catch (err) {
      console.error('Failed to load security monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const threatLevel = rateLimitEvents.length > 20 ? 'HIGH' : (rateLimitEvents.length > 5 ? 'ELEVATED' : 'NORMAL');

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#fef2f2', borderRadius: '6px', color: '#dc2626', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ShieldAlert size={16} /> Security Command & Threat Defense
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Security Monitoring & Rate-Limit Defense
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Real-time tracking of API rate-limit abuse events, brute force mitigation, and account suspensions.
          </p>
        </div>

        <button
          onClick={fetchSecurityData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Threats
        </button>
      </div>

      {/* Security Posture Status Banner */}
      <div style={{
        background: threatLevel === 'HIGH' ? '#fef2f2' : (threatLevel === 'ELEVATED' ? '#fffbeb' : '#f0fdf4'),
        border: `1px solid ${threatLevel === 'HIGH' ? '#fecaca' : (threatLevel === 'ELEVATED' ? '#fde68a' : '#bbf7d0')}`,
        borderRadius: '12px',
        padding: '18px 24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: threatLevel === 'HIGH' ? '#dc2626' : (threatLevel === 'ELEVATED' ? '#d97706' : '#16a34a'),
            color: '#ffffff',
            padding: '10px',
            borderRadius: '10px'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{
              fontSize: '15px',
              fontWeight: '800',
              color: threatLevel === 'HIGH' ? '#991b1b' : (threatLevel === 'ELEVATED' ? '#92400e' : '#166534')
            }}>
              Current Threat Defenses: {threatLevel} RISK
            </h3>
            <p style={{
              fontSize: '13px',
              color: threatLevel === 'HIGH' ? '#b91c1c' : (threatLevel === 'ELEVATED' ? '#b45309' : '#15803d'),
              marginTop: '2px'
            }}>
              Rate limiter active on public symptom triage and authentication endpoints. {rateLimitEvents.length} threshold trips intercepted.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          <div>
            <span style={{ color: '#64748b' }}>Suspended Accounts: </span>
            <strong style={{ color: '#b91c1c' }}>{suspendedUsers.length}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Rate Limit Incidents: </span>
            <strong style={{ color: '#dc2626' }}>{rateLimitEvents.length}</strong>
          </div>
        </div>
      </div>

      {/* Grid: Rate Limits & Suspended Accounts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        {/* Rate Limit Events */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="#dc2626" /> Rate-Limit Interceptions
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Table: <code style={{ fontSize: '11px' }}>public.rate_limit_events</code>
            </span>
          </div>

          {rateLimitEvents.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Zero rate-limit violations recorded. All inbound traffic is within authorized thresholds.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Timestamp</th>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>IP Address</th>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Endpoint</th>
                  </tr>
                </thead>
                <tbody>
                  {rateLimitEvents.map((evt, idx) => (
                    <tr key={evt.id || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(evt.blocked_at).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: '600', color: '#b91c1c' }}>
                        {evt.ip_address}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                          {evt.endpoint}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Suspended Accounts */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserX size={18} color="#b91c1c" /> Suspended Accounts
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {suspendedUsers.length} active suspensions
            </span>
          </div>

          {suspendedUsers.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              Zero accounts currently under administrative suspension.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Account</th>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Role</th>
                    <th style={{ padding: '10px 14px', fontWeight: '600' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {suspendedUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{u.full_name || u.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>
                        {u.role}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', fontWeight: '700', fontSize: '11px' }}>
                          Suspended
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
