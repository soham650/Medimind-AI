import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Stethoscope,
  AlertTriangle,
  Search,
  RefreshCw,
  FileCheck,
  UserCheck,
  Award,
  X
} from 'lucide-react';

/**
 * Doctor Verification & Credentialing (Phase 7 Mandatory Approval Gate)
 * Invokes PostgreSQL SECURITY DEFINER stored procedure `public.verify_doctor_tx()`
 */
export default function DoctorVerification() {
  const [doctors, setDoctors] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionModal, setRejectionModal] = useState({ open: false, doctor: null, reason: '' });
  const [toastMessage, setToastMessage] = useState(null);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDoctorApplications(filter);
      setDoctors(data);
    } catch (err) {
      console.error('Error fetching doctor applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [filter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = async (doctor) => {
    if (!window.confirm(`Authorize Dr. ${doctor.full_name || 'Practitioner'} for clinical practice in MediMind? This will execute verify_doctor_tx.`)) return;
    setActionLoading(doctor.id);
    try {
      await adminService.verifyDoctor(doctor.id, 'approved');
      showToast(`Dr. ${doctor.full_name} has been verified and granted practice rights.`);
      await loadDoctors();
    } catch (err) {
      alert('Verification transaction failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionModal.reason.trim()) {
      alert('Please provide a specific clinical or regulatory non-compliance reason.');
      return;
    }
    const doctorId = rejectionModal.doctor?.id;
    setActionLoading(doctorId);
    try {
      await adminService.verifyDoctor(doctorId, 'rejected', rejectionModal.reason.trim());
      showToast(`Verification for Dr. ${rejectionModal.doctor?.full_name} was rejected.`);
      setRejectionModal({ open: false, doctor: null, reason: '' });
      await loadDoctors();
    } catch (err) {
      alert('Rejection transaction failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDoctors = doctors.filter(d =>
    (d.full_name || d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.specialization || d.specialist || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.qualification || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <CheckCircle size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#fffbeb', borderRadius: '6px', color: '#d97706', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ShieldCheck size={16} /> Mandatory Clinical Credentialing Gate
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Doctor Credential Verification
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Authoritative license review executing atomic PostgreSQL transaction <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#0f172a' }}>verify_doctor_tx</code> with immutable audit trail.
          </p>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
                background: filter === f ? '#ffffff' : 'transparent',
                color: filter === f ? '#0a4bb5' : '#64748b',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Telemetry Banner */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', minWidth: '300px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search practitioner by name, specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
          <span>Applications in queue:</span>
          <strong style={{ color: '#0f172a' }}>{filteredDoctors.length}</strong>
        </div>
      </div>

      {/* Applications List */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#d97706' }} />
          Loading credential applications...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '48px', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
          <FileCheck size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#475569' }}>No applications in this category</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>All physician credentialing applications have been reviewed.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredDoctors.map(doc => {
            const isApproved = doc.verification_status === 'approved';
            const isRejected = doc.verification_status === 'rejected';
            const isPending = doc.verification_status === 'pending';

            return (
              <div
                key={doc.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: isPending ? '1px solid #fde68a' : '1px solid #e2e8f0',
                  boxShadow: isPending ? '0 4px 12px rgba(217, 119, 6, 0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ padding: '20px' }}>
                  {/* Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                          Dr. {doc.full_name || doc.name}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600' }}>
                          {doc.specialization || doc.specialist || 'General Medicine'}
                        </div>
                      </div>
                    </div>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: isApproved ? '#dcfce7' : (isRejected ? '#fee2e2' : '#fef3c7'),
                      color: isApproved ? '#15803d' : (isRejected ? '#b91c1c' : '#b45309')
                    }}>
                      {isApproved && <CheckCircle size={12} />}
                      {isRejected && <XCircle size={12} />}
                      {isPending && <Clock size={12} />}
                      {doc.verification_status}
                    </span>
                  </div>

                  {/* Doctor Metadata */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    <div><strong>Qualification:</strong> {doc.qualification || 'MBBS / MD'}</div>
                    <div><strong>Experience:</strong> {doc.experience_years ? `${doc.experience_years} years` : 'N/A'}</div>
                    <div><strong>Consultation Fee:</strong> ₹{doc.consultation_fee || 500}</div>
                    <div><strong>Doctor ID:</strong> <span style={{ fontFamily: 'monospace' }}>{doc.id.slice(0, 16)}...</span></div>
                  </div>

                  {doc.bio && (
                    <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '14px', lineHeight: '1.4' }}>
                      "{doc.bio}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {isPending ? (
                    <>
                      <button
                        onClick={() => setRejectionModal({ open: true, doctor: doc, reason: '' })}
                        disabled={actionLoading === doc.id}
                        style={{
                          padding: '7px 14px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>

                      <button
                        onClick={() => handleApprove(doc)}
                        disabled={actionLoading === doc.id}
                        style={{
                          padding: '7px 16px',
                          background: '#16a34a',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <CheckCircle size={14} />
                        {actionLoading === doc.id ? 'Verifying...' : 'Authorize Practice'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleApprove(doc)}
                      disabled={actionLoading === doc.id}
                      style={{
                        padding: '6px 12px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '12px',
                        color: '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      Re-verify (Override)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Compliance Reason Modal */}
      {rejectionModal.open && (
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
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: '800', fontSize: '15px' }}>
                <AlertTriangle size={18} /> Regulatory Rejection Notice
              </div>
              <button
                onClick={() => setRejectionModal({ open: false, doctor: null, reason: '' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                Rejecting verification for <strong>Dr. {rejectionModal.doctor?.full_name}</strong> will record an immutable compliance rejection in <code style={{ fontSize: '12px' }}>doctor_verifications</code> and dispatch a notification to the applicant.
              </p>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Non-Compliance Reason (Required):
              </label>
              <textarea
                rows={4}
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. State Medical Council registration certificate illegible, license expired, or mismatched name details."
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setRejectionModal({ open: false, doctor: null, reason: '' })}
                style={{ padding: '8px 14px', background: '#e2e8f0', color: '#475569', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading === rejectionModal.doctor?.id}
                style={{ padding: '8px 16px', background: '#dc2626', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
