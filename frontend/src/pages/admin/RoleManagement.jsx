import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services';
import {
  Lock,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Users,
  ShieldAlert,
  ArrowRight,
  X
} from 'lucide-react';

export default function RoleManagement() {
  const { user: currentAuthUser, role: currentAuthRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleModal, setRoleModal] = useState({ open: false, user: null, selectedRole: '' });
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchRoleData = async () => {
    setLoading(true);
    try {
      const usersRes = await adminService.getUsers({ limit: 100 });
      setUsers(usersRes.users || []);
    } catch (err) {
      console.error('Error fetching role data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRoleChangeSubmit = async () => {
    if (!roleModal.user || !roleModal.selectedRole) return;
    const targetUser = roleModal.user;
    const newRole = roleModal.selectedRole;

    // Operational Guardrail: Prevent modifying self
    if (targetUser.id === currentAuthUser?.id && newRole !== 'admin') {
      alert('Security Violation: You cannot demote your own active administrative account.');
      return;
    }

    setUpdating(true);
    try {
      await adminService.assignRole(targetUser.id, newRole);

      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      showToast(`Role for ${targetUser.full_name || targetUser.email} changed to ${newRole}.`);
      setRoleModal({ open: false, user: null, selectedRole: '' });
    } catch (err) {
      alert('Role assignment failed: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const canonicalRoles = [
    { id: 'patient', name: 'Patient', desc: 'Standard platform user: symptom triage, consultations, orders' },
    { id: 'doctor', name: 'Doctor', desc: 'Verified medical practitioner: consultations, prescriptions' },
    { id: 'pharmacist', name: 'Pharmacist', desc: 'Licensed retail pharmacist: inventory, order fulfillment' },
    { id: 'admin', name: 'Admin', desc: 'Platform Administrator: governance, verifications, system oversight' }
  ];

  const filteredUsers = users.filter(u => {
    const matchesRole = filterRole === 'all' || u.role === filterRole;
    const matchesSearch = (u.full_name || u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Toast Notification */}
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#faf5ff', borderRadius: '6px', color: '#9333ea', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Lock size={16} /> Authoritative RBAC Governance
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Role Management & Escalation Controls
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Authoritative source of truth stored in PostgreSQL <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>public.user_roles</code>. Protected by RLS policies.
          </p>
        </div>

        <button
          onClick={fetchRoleData}
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

      {/* Guardrail Callout Banner */}
      <div style={{
        background: '#fdf4ff',
        border: '1px solid #f5d0fe',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <div style={{ background: '#9333ea', color: '#ffffff', padding: '10px', borderRadius: '10px' }}>
          <ShieldAlert size={20} />
        </div>
        <div style={{ fontSize: '13px', color: '#581c87', lineHeight: '1.4' }}>
          <strong>Role Governance Invariant:</strong> Application roles are strictly <code style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>patient</code>, <code style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>doctor</code>, <code style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>pharmacist</code>, and <code style={{ background: '#ffffff', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>admin</code>. Admin is the highest administrative authority in the system.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['all', 'patient', 'doctor', 'pharmacist', 'admin'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: filterRole === r ? '#9333ea' : '#f1f5f9',
                color: filterRole === r ? '#ffffff' : '#475569'
              }}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
          <input
            type="text"
            placeholder="Filter by name, email..."
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
      </div>

      {/* Users Role Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#9333ea' }} />
            Loading role assignments...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No accounts match the selected role filter.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>User Name / Email</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Assigned RBAC Role</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Privilege Tier</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>User ID</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const isUserAdmin = u.role === 'admin';
                  const canModify = u.id !== currentAuthUser?.id;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>
                          {u.full_name || u.name || 'User'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {u.email}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          background: u.role === 'admin' ? '#fef3c7' : (u.role === 'doctor' ? '#eff6ff' : (u.role === 'pharmacist' ? '#f0fdf4' : '#f1f5f9')),
                          color: u.role === 'admin' ? '#b45309' : (u.role === 'doctor' ? '#1d4ed8' : (u.role === 'pharmacist' ? '#15803d' : '#475569'))
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: '12px' }}>
                        {u.role === 'admin' ? 'Administrator' : 'Standard User'}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#94a3b8', fontSize: '11px' }}>
                        {u.id.slice(0, 16)}...
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setRoleModal({ open: true, user: u, selectedRole: u.role || 'patient' })}
                          disabled={!canModify || u.id === currentAuthUser?.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: canModify && u.id !== currentAuthUser?.id ? '#ffffff' : '#f1f5f9',
                            color: canModify && u.id !== currentAuthUser?.id ? '#0a4bb5' : '#94a3b8',
                            cursor: canModify && u.id !== currentAuthUser?.id ? 'pointer' : 'not-allowed',
                            fontSize: '12px',
                            fontWeight: '700'
                          }}
                        >
                          Change Role
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

      {/* Role Assignment Modal */}
      {roleModal.open && (
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
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9333ea', fontWeight: '800', fontSize: '16px' }}>
                <Lock size={18} /> Modify User Authorization Role
              </div>
              <button
                onClick={() => setRoleModal({ open: false, user: null, selectedRole: '' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                <div><strong>Target Account:</strong> {roleModal.user?.full_name || roleModal.user?.name}</div>
                <div style={{ color: '#64748b' }}><strong>Email:</strong> {roleModal.user?.email}</div>
                <div style={{ color: '#64748b' }}><strong>Current Role:</strong> <span style={{ fontWeight: '700', color: '#0f172a' }}>{roleModal.user?.role}</span></div>
              </div>

              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '10px' }}>
                Select Authoritative Role:
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {canonicalRoles.map(cr => {
                  const isRestricted = false;

                  return (
                    <label
                      key={cr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: roleModal.selectedRole === cr.id ? '2px solid #9333ea' : '1px solid #e2e8f0',
                        background: isRestricted ? '#f8fafc' : (roleModal.selectedRole === cr.id ? '#faf5ff' : '#ffffff'),
                        cursor: isRestricted ? 'not-allowed' : 'pointer',
                        opacity: isRestricted ? 0.6 : 1
                      }}
                    >
                      <input
                        type="radio"
                        name="roleChoice"
                        value={cr.id}
                        disabled={isRestricted}
                        checked={roleModal.selectedRole === cr.id}
                        onChange={() => setRoleModal(prev => ({ ...prev, selectedRole: cr.id }))}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {cr.name}
                          {isRestricted && <span style={{ fontSize: '11px', color: '#dc2626' }}>(Super Admin required)</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          {cr.desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setRoleModal({ open: false, user: null, selectedRole: '' })}
                style={{ padding: '8px 14px', background: '#e2e8f0', color: '#475569', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChangeSubmit}
                disabled={updating || roleModal.selectedRole === roleModal.user?.role}
                style={{ padding: '8px 18px', background: '#9333ea', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
              >
                {updating ? 'Updating...' : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
