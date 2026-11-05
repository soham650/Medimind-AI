import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import {
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Store,
  AlertTriangle,
  Search,
  RefreshCw,
  FileCheck,
  Building,
  X
} from 'lucide-react';

/**
 * Pharmacy Verification & Licensing (Phase 7 Mandatory Approval Gate)
 * Invokes PostgreSQL SECURITY DEFINER stored procedure `public.verify_pharmacy_tx()`
 */
export default function PharmacyVerification() {
  const [pharmacies, setPharmacies] = useState([]);
  const [filter, setFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionModal, setRejectionModal] = useState({ open: false, pharmacy: null, reason: '' });
  const [toastMessage, setToastMessage] = useState(null);

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPharmacyApplications(filter);
      setPharmacies(data);
    } catch (err) {
      console.error('Error fetching pharmacy applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacies();
  }, [filter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = async (pharmacy) => {
    if (!window.confirm(`Authorize retail pharmacy "${pharmacy.pharmacy_name || 'Dispensary'}" for drug dispensing? This will execute verify_pharmacy_tx.`)) return;
    setActionLoading(pharmacy.id);
    try {
      await adminService.verifyPharmacy(pharmacy.id, 'approved');
      showToast(`Pharmacy "${pharmacy.pharmacy_name}" has been approved for retail order fulfillment.`);
      await loadPharmacies();
    } catch (err) {
      alert('Verification transaction failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionModal.reason.trim()) {
      alert('Please specify regulatory or Form 20/21 non-compliance reason.');
      return;
    }
    const pharmacyId = rejectionModal.pharmacy?.id;
    setActionLoading(pharmacyId);
    try {
      await adminService.verifyPharmacy(pharmacyId, 'rejected', rejectionModal.reason.trim());
      showToast(`Verification for "${rejectionModal.pharmacy?.pharmacy_name}" was rejected.`);
      setRejectionModal({ open: false, pharmacy: null, reason: '' });
      await loadPharmacies();
    } catch (err) {
      alert('Rejection transaction failed: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPharmacies = pharmacies.filter(p =>
    (p.pharmacy_name || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.license_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase())
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#fef3c7', borderRadius: '6px', color: '#b45309', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ShieldCheck size={16} /> Retail Dispensary Licensing Gate
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Pharmacy License Verification
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Verification of Form 20/21 retail drug licenses executing atomic procedure <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', color: '#0f172a' }}>verify_pharmacy_tx</code>.
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

      {/* Search and Counts */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', minWidth: '300px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search dispensary by name, license no..."
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
          <strong style={{ color: '#0f172a' }}>{filteredPharmacies.length}</strong>
        </div>
      </div>

      {/* Dispensaries Grid */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#b45309' }} />
          Loading dispensary applications...
        </div>
      ) : filteredPharmacies.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '48px', textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
          <FileCheck size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#475569' }}>No pharmacy applications found</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>All dispensary license applications in this category have been processed.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredPharmacies.map(pharm => {
            const isApproved = pharm.verification_status === 'approved';
            const isRejected = pharm.verification_status === 'rejected';
            const isPending = pharm.verification_status === 'pending';

            return (
              <div
                key={pharm.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  border: isPending ? '1px solid #fde68a' : '1px solid #e2e8f0',
                  boxShadow: isPending ? '0 4px 12px rgba(180, 83, 9, 0.06)' : '0 1px 3px rgba(0,0,0,0.02)',
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
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                        <Store size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                          {pharm.pharmacy_name}
                        </h3>
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                          License: {pharm.license_number || 'DL-PENDING'}
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
                      {pharm.verification_status}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                    <div><strong>Contact Person:</strong> {pharm.contact_person || 'Pharmacist'}</div>
                    <div><strong>Phone:</strong> {pharm.phone || 'Not recorded'}</div>
                    <div><strong>Address:</strong> {pharm.address || 'Address pending registration'}</div>
                    <div><strong>24x7 Dispensing:</strong> {pharm.is_24x7 ? 'Yes' : 'No'}</div>
                    <div><strong>Dispensary ID:</strong> <span style={{ fontFamily: 'monospace' }}>{pharm.id.slice(0, 16)}...</span></div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{ padding: '14px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {isPending ? (
                    <>
                      <button
                        onClick={() => setRejectionModal({ open: true, pharmacy: pharm, reason: '' })}
                        disabled={actionLoading === pharm.id}
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
                        onClick={() => handleApprove(pharm)}
                        disabled={actionLoading === pharm.id}
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
                        {actionLoading === pharm.id ? 'Verifying...' : 'Authorize Dispensing'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleApprove(pharm)}
                      disabled={actionLoading === pharm.id}
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
                <AlertTriangle size={18} /> Pharmacy Licensing Rejection
              </div>
              <button
                onClick={() => setRejectionModal({ open: false, pharmacy: null, reason: '' })}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                Rejecting licensing for <strong>{rejectionModal.pharmacy?.pharmacy_name}</strong> will record a rejection in <code style={{ fontSize: '12px' }}>pharmacy_verifications</code> and notify the dispensary administrator.
              </p>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Non-Compliance Reason (Required):
              </label>
              <textarea
                rows={4}
                value={rejectionModal.reason}
                onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Form 20/21 license certificate invalid, registered pharmacist credential absent, or jurisdiction mismatch."
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
                onClick={() => setRejectionModal({ open: false, pharmacy: null, reason: '' })}
                style={{ padding: '8px 14px', background: '#e2e8f0', color: '#475569', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading === rejectionModal.pharmacy?.id}
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
