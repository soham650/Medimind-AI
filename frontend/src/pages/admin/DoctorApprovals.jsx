import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { CheckCircle, XCircle, Clock, ShieldCheck, Stethoscope, AlertTriangle, Search } from 'lucide-react';

/**
 * Super Admin: Doctor Verification & Approval Gate
 * View doctor applications, verify clinical credentials/license, approve or reject.
 */
export default function DoctorApprovals() {
  const [doctors, setDoctors] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionModal, setRejectionModal] = useState({ open: false, doctorId: null, reason: '' });

  useEffect(() => {
    loadDoctors();
  }, [filter]);

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

  const handleApprove = async (doctor) => {
    if (!window.confirm(`Approve Dr. ${doctor.name || doctor.full_name} for clinical practice in MediMind?`)) return;
    setActionLoading(doctor.id);
    try {
      await adminService.updateApprovalStatus(doctor.id, 'approved');
      await loadDoctors();
    } catch (err) {
      alert('Error approving doctor: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionModal.reason.trim()) {
      alert('Please provide a valid clinical compliance rejection reason.');
      return;
    }
    setActionLoading(rejectionModal.doctorId);
    try {
      await adminService.updateApprovalStatus(rejectionModal.doctorId, 'rejected', rejectionModal.reason);
      setRejectionModal({ open: false, doctorId: null, reason: '' });
      await loadDoctors();
    } catch (err) {
      alert('Error rejecting application: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    (d.name || d.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.specialist || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.license_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <ShieldCheck size={18} /> MANDATORY ADMIN APPROVAL GATE
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Doctor Verification & Credentialing
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Review medical practitioner credentials before enabling them in patient triage search and teleconsultations.
          </p>
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '8px', gap: '4px' }}>
          {['pending', 'approved', 'rejected', 'all'].map((f) => (
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
                color: filter === f ? '#0a4bb5' : '#475569',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search and stats bar */}
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Filter doctors by name, medical license #, or specialty..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '14px',
            color: '#1e293b'
          }}
        />
        <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
          Showing <strong>{filteredDoctors.length}</strong> record(s)
        </span>
      </div>

      {/* Doctor Cards / Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading practitioner credentialing queue...
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <Stethoscope size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>No doctor applications in this queue</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            All incoming medical practitioner profiles matching the "{filter}" filter have been reviewed.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredDoctors.map((doc) => {
            const isPending = doc.approval_status === 'pending';
            const isApproved = doc.approval_status === 'approved';
            const isRejected = doc.approval_status === 'rejected';

            return (
              <div
                key={doc.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: isPending ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  padding: '20px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        Dr. {doc.name || doc.full_name || 'Practitioner'}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '600' }}>
                        {doc.specialist || 'General Physician'}
                      </span>
                    </div>

                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background: isApproved ? '#dcfce7' : (isRejected ? '#fee2e2' : '#fef3c7'),
                      color: isApproved ? '#166534' : (isRejected ? '#991b1b' : '#92400e')
                    }}>
                      {isApproved ? <CheckCircle size={12} /> : (isRejected ? <XCircle size={12} /> : <Clock size={12} />)}
                      {doc.approval_status || 'pending'}
                    </span>
                  </div>

                  {/* Details grid */}
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div><strong>License #:</strong> {doc.license_number || 'Under Verification'}</div>
                    <div><strong>Email:</strong> {doc.email}</div>
                    <div><strong>Clinic/Hospital:</strong> {doc.clinic_id || 'MediMind Clinical Partner'}</div>
                    <div><strong>Experience:</strong> {doc.experience_years || 5} Years</div>
                    <div><strong>Consultation Fee:</strong> ₹{doc.consultation_fee || 500}</div>
                    {doc.rejection_reason && (
                      <div style={{ color: '#dc2626', marginTop: '4px' }}>
                        <strong>Rejection Reason:</strong> {doc.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleApprove(doc)}
                        disabled={actionLoading === doc.id}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#16a34a',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <CheckCircle size={14} /> Approve Doctor
                      </button>
                      <button
                        onClick={() => setRejectionModal({ open: true, doctorId: doc.id, reason: '' })}
                        disabled={actionLoading === doc.id}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #dc2626',
                          background: '#ffffff',
                          color: '#dc2626',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => adminService.updateApprovalStatus(doc.id, isApproved ? 'rejected' : 'approved', 'Status toggled by Super Admin').then(loadDoctors)}
                      style={{
                        width: '100%',
                        padding: '6px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f1f5f9',
                        color: '#475569',
                        fontWeight: '600',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Toggle Status (Change to {isApproved ? 'Rejected' : 'Approved'})
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Specify Rejection Rationale
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              The applicant will be informed of why their medical credentials failed validation.
            </p>
            <textarea
              rows={4}
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g. State Medical Council registration ID does not match records, or document expired..."
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                marginBottom: '16px',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRejectionModal({ open: false, doctorId: null, reason: '' })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
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
