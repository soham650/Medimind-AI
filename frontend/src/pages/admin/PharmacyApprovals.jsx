import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { CheckCircle, XCircle, Clock, ShieldCheck, Store, Search } from 'lucide-react';

/**
 * Super Admin: Pharmacy Verification & Approval Gate
 * View pharmacy applications, verify retail drug license & GSTIN, approve or reject.
 */
export default function PharmacyApprovals() {
  const [pharmacies, setPharmacies] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPharmacies();
  }, [filter]);

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

  const handleApprove = async (pharmacy) => {
    if (!window.confirm(`Approve "${pharmacy.pharmacy_name || pharmacy.name}" for prescription dispensing?`)) return;
    setActionLoading(pharmacy.id);
    try {
      await adminService.updateApprovalStatus(pharmacy.id, 'approved');
      await loadPharmacies();
    } catch (err) {
      alert('Error approving pharmacy: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (pharmacy) => {
    const reason = prompt('Specify regulatory rejection reason:');
    if (!reason) return;
    setActionLoading(pharmacy.id);
    try {
      await adminService.updateApprovalStatus(pharmacy.id, 'rejected', reason);
      await loadPharmacies();
    } catch (err) {
      alert('Error rejecting pharmacy: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPharmacies = pharmacies.filter(p =>
    (p.pharmacy_name || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.license_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.gst_number || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <ShieldCheck size={18} /> MANDATORY ADMIN APPROVAL GATE
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Pharmacy License Verification
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Accredit medical stores and pharmacies to receive digital prescriptions and fulfill medicine orders.
          </p>
        </div>

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
          placeholder="Filter pharmacies by store name, Drug License (DL) #, or GSTIN..."
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
          Showing <strong>{filteredPharmacies.length}</strong> record(s)
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          Loading pharmacy compliance records...
        </div>
      ) : filteredPharmacies.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <Store size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>No pharmacy applications found</h3>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            No pharmacy profiles currently match the "{filter}" filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredPharmacies.map((pharmacy) => {
            const isPending = pharmacy.approval_status === 'pending';
            const isApproved = pharmacy.approval_status === 'approved';
            const isRejected = pharmacy.approval_status === 'rejected';

            return (
              <div
                key={pharmacy.id}
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
                        {pharmacy.pharmacy_name || pharmacy.name || 'Medical Store'}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Proprietor: {pharmacy.name || 'Pharmacist'}
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
                      {pharmacy.approval_status || 'pending'}
                    </span>
                  </div>

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
                    <div><strong>Drug License (DL) #:</strong> {pharmacy.license_number || 'DL-PENDING'}</div>
                    <div><strong>GSTIN:</strong> {pharmacy.gst_number || 'Unspecified'}</div>
                    <div><strong>Store Address:</strong> {pharmacy.pharmacy_address || 'Main Branch'}</div>
                    <div><strong>Contact:</strong> {pharmacy.mobile || pharmacy.email}</div>
                    {pharmacy.rejection_reason && (
                      <div style={{ color: '#dc2626', marginTop: '4px' }}>
                        <strong>Rejection Reason:</strong> {pharmacy.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                  {isPending ? (
                    <>
                      <button
                        onClick={() => handleApprove(pharmacy)}
                        disabled={actionLoading === pharmacy.id}
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
                        <CheckCircle size={14} /> Approve License
                      </button>
                      <button
                        onClick={() => handleReject(pharmacy)}
                        disabled={actionLoading === pharmacy.id}
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
                      onClick={() => adminService.updateApprovalStatus(pharmacy.id, isApproved ? 'rejected' : 'approved', 'Status toggled by Admin').then(loadPharmacies)}
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
    </div>
  );
}
