import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, ShieldAlert, AlertTriangle, LogOut } from 'lucide-react';
import { UserRoles } from '../../types/database';

/**
 * RoleProtectedRoute
 * Guards routes against unauthenticated and unauthorized access.
 * Enforces:
 * 1. Auth loading state (no dashboard flashing or temporary leak)
 * 2. Supabase session validation
 * 3. Database canonical role check
 * 4. Account status / suspension check
 * 5. Direct URL access restriction with redirect to the user's canonical dashboard
 * 6. Doctor & Pharmacy verification gate (/pending-approval)
 */
export default function RoleProtectedRoute({ allowedRoles = [], requireApproved = true, children }) {
  const { user, session, role, profile, approvalStatus, loading, logout } = useAuth();
  const location = useLocation();

  // 1. Loading State: Only block if user credentials are not yet available
  if (loading && !user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f8fafc',
        gap: '12px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0a4bb5'
        }}>
          <Activity className="animate-spin" size={28} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            MediMind Session
          </h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Verifying security access...
          </span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login
  if (!user || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Missing Role check
  if (!role) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '36px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fef3c7',
            color: '#b45309',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <AlertTriangle size={36} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            No Application Role Assigned
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
            Your account is authenticated, but no canonical role is assigned in the system database. Please contact the administrator.
          </p>
          <button
            onClick={logout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#0f766e',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <LogOut size={16} /> Return to Sign In
          </button>
        </div>
      </div>
    );
  }

  // 4. Account Deactivated or Suspended
  if (profile?.deleted_at || profile?.status === 'suspended' || profile?.approval_status === 'suspended') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          background: '#ffffff',
          borderRadius: '16px',
          padding: '36px',
          textAlign: 'center',
          border: '1px solid #fee2e2',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#fee2e2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <ShieldAlert size={36} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
            Account Unavailable
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
            Your account is currently inactive or suspended. Please contact the administrator for assistance.
          </p>
          <button
            onClick={logout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#dc2626',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 5. Verification / Admin Approval Gate for Doctor & Pharmacist
  if (
    requireApproved &&
    (role === UserRoles.DOCTOR || role === UserRoles.PHARMACIST) &&
    approvalStatus !== 'approved'
  ) {
    if (location.pathname !== '/pending-approval') {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  // 6. Role-Based Access Control: Block unauthorized direct URL access
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to the user's canonical role dashboard
    const canonicalDashboard = 
      role === UserRoles.DOCTOR ? '/doctor/dashboard' :
      role === UserRoles.PHARMACIST ? '/pharmacy/dashboard' :
      role === UserRoles.ADMIN ? '/admin/dashboard' :
      '/patient/dashboard';

    return <Navigate to={canonicalDashboard} replace />;
  }

  // 7. All checks passed: Render protected content
  return children;
}
