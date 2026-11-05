import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import {
  Shield,
  Activity,
  RefreshCw,
  Search,
  Filter,
  Eye,
  FileText,
  Calendar,
  Lock,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAuditLogs({
        action: actionFilter,
        entity: entityFilter,
        search: searchQuery,
        limit: 100
      });
      setLogs(res.logs);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadgeColor = (action) => {
    if (!action) return { bg: '#f1f5f9', color: '#475569' };
    if (action.includes('APPROVE') || action.includes('ACTIVATE')) {
      return { bg: '#dcfce7', color: '#15803d' };
    }
    if (action.includes('REJECT') || action.includes('SUSPEND') || action.includes('DENIED') || action.includes('BLOCK')) {
      return { bg: '#fee2e2', color: '#b91c1c' };
    }
    if (action.includes('ROLE') || action.includes('UPDATE') || action.includes('MODIFY')) {
      return { bg: '#fef3c7', color: '#b45309' };
    }
    return { bg: '#eff6ff', color: '#1d4ed8' };
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#f1f5f9', borderRadius: '6px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Shield size={16} /> Immutable Compliance Logs
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Security Audit Trail & Compliance Ledger
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Append-only, cryptographically verified audit records satisfying HIPAA §164.312(b) and ABDM security guidelines.
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
            fontWeight: '600',
            color: '#334155'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Ledger
        </button>
      </div>

      {/* Immutability Callout */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#475569'
      }}>
        <Lock size={18} color="#0a4bb5" style={{ flexShrink: 0 }} />
        <span>
          <strong>Database Immutability Invariant:</strong> PostgreSQL Row Level Security completely prohibits UPDATE and DELETE operations on <code style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>public.audit_logs</code> for all non-superusers. All administrative events are permanently logged.
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Action Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff', outline: 'none' }}
            >
              <option value="all">All Actions</option>
              <option value="DOCTOR_APPROVED">DOCTOR_APPROVED</option>
              <option value="DOCTOR_REJECTED">DOCTOR_REJECTED</option>
              <option value="PHARMACY_APPROVED">PHARMACY_APPROVED</option>
              <option value="PHARMACY_REJECTED">PHARMACY_REJECTED</option>
              <option value="USER_SUSPENDED">USER_SUSPENDED</option>
              <option value="USER_ACTIVATED">USER_ACTIVATED</option>
              <option value="ROLE_MODIFIED">ROLE_MODIFIED</option>
              <option value="ADMIN_ROLE_ASSIGNED">ADMIN_ROLE_ASSIGNED</option>
              <option value="NOTIFICATION_BROADCAST_SENT">NOTIFICATION_BROADCAST_SENT</option>
            </select>
          </div>

          {/* Entity Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff', outline: 'none' }}
            >
              <option value="all">All Entities</option>
              <option value="doctor">Doctor</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="profile">Profile</option>
              <option value="user_roles">User Roles</option>
              <option value="notifications">Notifications</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search action, details, entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              background: '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Filter
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#475569' }} />
            Loading compliance ledger...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No audit records match the current filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Action Code</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Target Entity</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Actor Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Target ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const badge = getActionBadgeColor(log.action);

                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          background: badge.bg,
                          color: badge.color
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155', fontWeight: '600' }}>
                        {log.target_entity || log.resource_type || 'system'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        {log.actor_role || log.user_role || 'admin'}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#64748b', fontSize: '12px' }}>
                        {log.target_id || log.resource_id ? `${String(log.target_id || log.resource_id).slice(0, 16)}...` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          <Eye size={13} /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Inspection Modal */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#0a4bb5" /> Immutable Audit Event
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Event ID:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.id}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Timestamp:</span>
                <span>{new Date(selectedLog.created_at).toLocaleString()}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Action Code:</span>
                <span style={{ fontWeight: '800' }}>{selectedLog.action}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Target Entity:</span>
                <span>{selectedLog.target_entity || selectedLog.resource_type || '—'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Target ID:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.target_id || selectedLog.resource_id || '—'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Actor ID:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.actor_id || selectedLog.user_id || 'System'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Actor Role:</span>
                <span>{selectedLog.actor_role || selectedLog.user_role || 'admin'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>IP Address:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.ip_address || 'Encrypted / Internal Gateway'}</span>
              </div>

              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: '600', marginBottom: '6px' }}>
                  Payload Metadata:
                </span>
                <pre style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: '200px'
                }}>
                  {JSON.stringify(selectedLog.details || selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ padding: '8px 18px', background: '#334155', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
