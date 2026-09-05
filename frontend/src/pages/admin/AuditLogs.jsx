import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Shield, Activity, RefreshCw } from 'lucide-react';

/**
 * Super Admin: Audit & Logging Service (Supporting Service 9)
 * HIPAA & ABDM compliance event trails: logins, approvals, digital Rx issuance, orders.
 */
export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <Shield size={18} /> SUPPORTING SERVICE 9: AUDIT & LOGGING
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Security Audit Trail & System Logs
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Immutable logs of user actions, credential verifications, and clinical workflow transitions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
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
            fontWeight: '600'
          }}
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            Fetching encrypted audit logs...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <Activity size={32} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ color: '#1e293b', fontWeight: '700' }}>No audit records generated yet</h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              System actions such as Doctor approvals, prescriptions, and order updates will automatically stream here.
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Timestamp (UTC)</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Action Performed</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Actor / Role</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Resource</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: log.action.includes('APPROVED') ? '#dcfce7' : (log.action.includes('REJECTED') ? '#fee2e2' : '#eff6ff'),
                      color: log.action.includes('APPROVED') ? '#166534' : (log.action.includes('REJECTED') ? '#991b1b' : '#1d4ed8')
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: '600' }}>
                    {log.user_role ? log.user_role.toUpperCase() : 'SYSTEM'}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>
                    {log.resource_type} ({log.resource_id ? log.resource_id.slice(0, 8) + '...' : 'general'})
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>
                    {JSON.stringify(log.details || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
