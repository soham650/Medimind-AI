import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services';
import {
  Users,
  Shield,
  Search,
  Filter,
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
  ShieldAlert
} from 'lucide-react';

export default function UserManagement() {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUsers({
        role: roleFilter,
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
  }, [roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'suspended' : 'approved';
    setUpdatingId(userId);
    try {
      await adminService.updateUserStatus(userId, nextStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, approval_status: nextStatus } : u))
      );
      showToast(`User status updated to ${nextStatus}.`);
    } catch (err) {
      alert('Status update failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'doctor':
        return { bg: '#dcfce7', color: '#166534', label: 'Doctor' };
      case 'pharmacy':
        return { bg: '#eff6ff', color: '#1d4ed8', label: 'Pharmacy' };
      case 'admin':
        return { bg: '#fef3c7', color: '#92400e', label: 'Admin' };
      default:
        return { bg: '#f1f5f9', color: '#334155', label: 'Patient' };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', color: '#15803d', label: 'Active / Approved', icon: CheckCircle2 };
      case 'suspended':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended', icon: Ban };
      case 'rejected':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected', icon: UserX };
      default:
        return { bg: '#fef3c7', color: '#b45309', label: 'Pending Review', icon: Clock };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1240px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <Users size={18} /> GOVERNANCE & ACCESS CONTROL
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            User Accounts & Role Governance
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Manage platform authentication profiles and enforce least-privilege security. Protected Health Information (PHI) is hidden from administrative logs.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={15} /> Refresh Directory
        </button>
      </div>

      {/* HIPAA Compliance Note Banner */}
      <div style={{
        padding: '14px 18px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '10px',
        color: '#1e40af',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '24px'
      }}>
        <Lock size={18} />
        <span>
          <strong>Healthcare Privacy Safeguard:</strong> This administrative view restricts access to identity metadata (Name, Email, Role, Approval Status). Clinical diagnoses, medical records, and prescriptions remain strictly confidential to patients and authorized clinicians.
        </span>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All Users (${totalCount})` },
            { key: 'patient', label: 'Patients' },
            { key: 'doctor', label: 'Doctors' },
            { key: 'pharmacy', label: 'Pharmacies' },
            { key: 'admin', label: 'Admins' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: roleFilter === tab.key ? '#0a4bb5' : '#f1f5f9',
                color: roleFilter === tab.key ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', minWidth: '280px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', paddingLeft: '8px', fontSize: '13px', width: '100%', color: '#1e293b' }}
          />
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '80px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Querying User Directory & Permissions...</p>
        </div>
      )}

      {/* Users Table */}
      {!loading && (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {users.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#64748b' }}>
              <Users size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>No Users Found</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>No user profiles match your active role or search criteria.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '14px 18px' }}>User Identity</th>
                  <th style={{ padding: '14px 18px' }}>Platform Role</th>
                  <th style={{ padding: '14px 18px' }}>Account Status</th>
                  <th style={{ padding: '14px 18px' }}>Registered On</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Status Governance</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleBadge = getRoleBadge(u.role);
                  const statusBadge = getStatusBadge(u.approval_status);
                  const StatusIcon = statusBadge.icon;
                  const isUpdating = updatingId === u.id;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#0a4bb5',
                            fontWeight: '800',
                            fontSize: '13px'
                          }}>
                            {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>
                              {u.full_name || 'Anonymous User'}
                            </strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: roleBadge.bg,
                          color: roleBadge.color
                        }}>
                          {roleBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: statusBadge.bg,
                          color: statusBadge.color
                        }}>
                          <StatusIcon size={13} /> {statusBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '16px 18px', color: '#64748b' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Initial Setup'}
                      </td>

                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleToggleStatus(u.id, u.approval_status)}
                          disabled={isUpdating || u.role === 'admin'}
                          style={{
                            padding: '6px 14px',
                            background: u.approval_status === 'approved' ? '#fee2e2' : '#dcfce7',
                            color: u.approval_status === 'approved' ? '#b91c1c' : '#15803d',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: u.role === 'admin' ? 'not-allowed' : 'pointer',
                            opacity: u.role === 'admin' ? 0.5 : 1
                          }}
                        >
                          {isUpdating ? 'Updating...' : u.approval_status === 'approved' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
