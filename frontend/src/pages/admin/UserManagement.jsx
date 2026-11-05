import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services';
import {
  Users,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Ban,
  UserCheck,
  UserX,
  Lock,
  Mail,
  Calendar,
  Eye,
  X
} from 'lucide-react';

export default function UserManagement() {
  const { user: currentAuthUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({
        role: roleFilter,
        status: statusFilter,
        search: searchQuery,
        limit: 100
      });
      setUsers(res.users);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Unable to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSuspend = async (u) => {
    const reason = prompt(`Reason for suspending user "${u.full_name || u.name || u.email}":`, 'Compliance investigation / Terms violation');
    if (!reason) return;
    setUpdatingId(u.id);
    try {
      await adminService.suspendUser(u.id, reason);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, approval_status: 'suspended', status: 'suspended' } : x));
      showToast(`User ${u.full_name || u.email} has been suspended.`);
    } catch (err) {
      alert('Suspension failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReactivate = async (u) => {
    if (!window.confirm(`Reactivate account for "${u.full_name || u.name || u.email}"?`)) return;
    setUpdatingId(u.id);
    try {
      await adminService.reactivateUser(u.id);
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, approval_status: 'approved', status: 'active' } : x));
      showToast(`User ${u.full_name || u.email} reactivated successfully.`);
    } catch (err) {
      alert('Reactivation failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { bg: '#fef3c7', color: '#b45309', label: 'Admin' };
      case 'doctor':
        return { bg: '#eff6ff', color: '#1d4ed8', label: 'Doctor' };
      case 'pharmacist':
      case 'pharmacy':
        return { bg: '#f0fdf4', color: '#15803d', label: 'Pharmacist' };
      default:
        return { bg: '#f1f5f9', color: '#475569', label: 'Patient' };
    }
  };

  const getStatusBadge = (userItem) => {
    const isSuspended = userItem.status === 'suspended' || userItem.approval_status === 'suspended';
    const isApproved = userItem.approval_status === 'approved' || userItem.status === 'active';
    const isRejected = userItem.approval_status === 'rejected';

    if (isSuspended) {
      return { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended', icon: Ban };
    }
    if (isRejected) {
      return { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected', icon: UserX };
    }
    if (isApproved) {
      return { bg: '#dcfce7', color: '#15803d', label: 'Active', icon: CheckCircle2 };
    }
    return { bg: '#fef3c7', color: '#b45309', label: 'Pending', icon: Clock };
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#eff6ff', borderRadius: '6px', color: '#0a4bb5', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Users size={16} /> User Governance & Accounts
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Platform Account Registry
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Browse and govern accounts across patients, physicians, dispensaries, and administrators.
          </p>
        </div>

        <button
          onClick={fetchUsers}
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
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Role Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Roles' },
            { id: 'patient', label: 'Patients' },
            { id: 'doctor', label: 'Doctors' },
            { id: 'pharmacist', label: 'Pharmacists' },
            { id: 'admin', label: 'Admins' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setRoleFilter(r.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: roleFilter === r.id ? '#0a4bb5' : '#f1f5f9',
                color: roleFilter === r.id ? '#ffffff' : '#475569'
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'All Status' },
            { id: 'approved', label: 'Active' },
            { id: 'pending', label: 'Pending' },
            { id: 'suspended', label: 'Suspended' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === s.id ? '#334155' : '#f8fafc',
                color: statusFilter === s.id ? '#ffffff' : '#64748b'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search name, email..."
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
              padding: '8px 14px',
              background: '#0a4bb5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Count Summary */}
      <div style={{ marginBottom: '12px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
        Showing {users.length} of {totalCount} registered accounts
      </div>

      {/* Users Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#0a4bb5' }} />
            Loading accounts...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No users match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>User / Identity</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Registered</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleBadge = getRoleBadge(u.role);
                  const statusBadge = getStatusBadge(u);
                  const StatusIcon = statusBadge.icon;
                  const isSuspended = u.status === 'suspended' || u.approval_status === 'suspended';

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px' }}>
                            {(u.full_name || u.name || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>
                              {u.full_name || u.name || 'Unnamed User'}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: roleBadge.bg,
                          color: roleBadge.color
                        }}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: statusBadge.bg,
                          color: statusBadge.color
                        }}>
                          <StatusIcon size={12} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedUser(u)}
                            title="View Account Details"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}
                          >
                            <Eye size={13} /> Details
                          </button>

                          {isSuspended ? (
                            <button
                              onClick={() => handleReactivate(u)}
                              disabled={updatingId === u.id}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#16a34a',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              <UserCheck size={13} /> Reactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(u)}
                              disabled={updatingId === u.id || u.id === currentAuthUser?.id}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#dc2626',
                                color: '#ffffff',
                                cursor: u.id === currentAuthUser?.id ? 'not-allowed' : 'pointer',
                                opacity: u.id === currentAuthUser?.id ? 0.5 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              <Ban size={13} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
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
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Account Administrative Record
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>User ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#334155' }}>{selectedUser.id}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Full Name:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{selectedUser.full_name || selectedUser.name || 'Not provided'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Email:</span>
                <span style={{ color: '#0a4bb5' }}>{selectedUser.email}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Platform Role:</span>
                <span>{selectedUser.role}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Approval State:</span>
                <span>{selectedUser.approval_status || 'none'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Account Status:</span>
                <span>{selectedUser.status || 'active'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Phone:</span>
                <span>{selectedUser.phone || '—'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Created At:</span>
                <span>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : '—'}</span>
              </div>

              <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                <div style={{ fontWeight: '700', color: '#0f172a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={14} color="#0a4bb5" /> HIPAA Least-Privilege Safeguard
                </div>
                Clinical consultation notes, diagnoses, and medical charts are strictly isolated from administrative views and cannot be accessed from user management.
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ padding: '8px 16px', background: '#334155', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
