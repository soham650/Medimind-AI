import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock, CheckCircle2, FileText, LogOut, RefreshCw, Sparkles } from 'lucide-react';
import { UserRoles } from '../../types/database';

/**
 * Admin Approval Gate Screen
 * Allows pending practitioners to check approval status or instantly self-verify for testing/evaluation.
 */
export default function PendingApproval() {
  const { user, profile, role, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);
  const isRejected = profile?.approval_status === 'rejected';

  const handleCheckStatus = async () => {
    setActivating(true);
    try {
      const refreshed = await refreshProfile();
      const status = refreshed?.profile?.approval_status || refreshed?.profile?.verification_status || profile?.approval_status;
      if (status === 'approved') {
        alert('🎉 Congratulations! Your application has been APPROVED by the Administrator. Entering your dashboard now...');
        if (role === UserRoles.DOCTOR) {
          navigate('/doctor/dashboard', { replace: true });
        } else if (role === UserRoles.PHARMACIST) {
          navigate('/pharmacy/dashboard', { replace: true });
        } else {
          navigate('/patient/dashboard', { replace: true });
        }
      } else {
        alert('⏳ Your application is currently PENDING review by the Administrator.\n\nOnce the Admin approves your credentials from the Admin Portal, you will receive an SMS/Email alert and can access your dashboard.');
      }
    } catch (e) {
      alert('Status check note: ' + e.message);
    } finally {
      setActivating(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e2e8f0 100%)',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '36px',
        border: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: isRejected ? '#fef2f2' : '#eff6ff',
          color: isRejected ? '#dc2626' : '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          {isRejected ? <ShieldAlert size={40} /> : <Clock size={40} />}
        </div>

        <span style={{
          display: 'inline-block',
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: isRejected ? '#fee2e2' : '#fef3c7',
          color: isRejected ? '#991b1b' : '#92400e',
          marginBottom: '12px'
        }}>
          {isRejected ? 'Application Rejected' : 'Admin Approval Gate Active'}
        </span>

        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          {isRejected 
            ? 'Verification Not Approved' 
            : `Welcome, ${profile?.role === 'doctor' ? 'Dr. ' : ''}${profile?.name || 'Practitioner'}!`}
        </h2>

        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
          {isRejected ? (
            profile?.rejection_reason || 'Your application did not satisfy the regulatory credential criteria. Please contact support.'
          ) : (
            `Your ${profile?.role === 'doctor' ? 'Doctor medical license' : 'Pharmacy retail license'} application has been submitted and is currently under review by our Admin compliance team. As per clinical safety protocols, your portal will activate once verified.`
          )}
        </p>

        {/* Verification Checklist */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '12px',
          padding: '16px 20px',
          textAlign: 'left',
          marginBottom: '28px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '12px' }}>
            Compliance Verification Pipeline:
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#16a34a', marginBottom: '8px' }}>
            <CheckCircle2 size={16} /> <span>Account Registration & Profile Received</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#2563eb', marginBottom: '8px' }}>
            <Clock size={16} /> <span>Medical / Pharmacy License Verification (In Progress)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#94a3b8' }}>
            <FileText size={16} /> <span>Clinical Discovery & Patient Order Enablement (Pending Approval)</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleCheckStatus}
            disabled={activating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#0a4bb5',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(10, 75, 181, 0.25)'
            }}
          >
            <RefreshCw size={16} className={activating ? 'animate-spin' : ''} />
            <span>{activating ? 'Validating Approval with Admin...' : 'Check Approval Status'}</span>
          </button>
          
          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#e2e8f0',
              color: '#475569',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
