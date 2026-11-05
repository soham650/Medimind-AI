import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { Link } from 'react-router-dom';
import {
  Store,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  ShieldCheck,
  Ban,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  X
} from 'lucide-react';

export default function PharmacyManagement() {
  const [pharmacies, setPharmacies] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPharmacies({
        status: statusFilter,
        search: searchQuery,
        limit: 100
      });
      setPharmacies(res.pharmacies);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Error fetching pharmacies directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacies();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPharmacies();
  };

  const handleToggleSuspend = async (pharm) => {
    const isSuspended = pharm.verification_status === 'suspended';
    if (!window.confirm(`${isSuspended ? 'Reactivate' : 'Suspend'} dispensary "${pharm.pharmacy_name}"?`)) return;

    setUpdatingId(pharm.id);
    try {
      if (isSuspended) {
        await adminService.reactivateUser(pharm.id);
      } else {
        await adminService.suspendUser(pharm.id, 'Administrative suspension from Pharmacy Directory');
      }
      await fetchPharmacies();
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', color: '#15803d', label: 'Verified & Active', icon: CheckCircle2 };
      case 'rejected':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Rejected', icon: XCircle };
      case 'suspended':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Suspended', icon: Ban };
      default:
        return { bg: '#fef3c7', color: '#b45309', label: 'Pending Review', icon: Clock };
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#f0fdf4', borderRadius: '6px', color: '#16a34a', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Store size={16} /> Retail Dispensaries & Licensing
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Pharmacy Dispensary Directory
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Oversight of licensed retail dispensaries, Form 20/21 drug licenses, and operational status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/admin/pharmacy-verification"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#b45309',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            <ShieldCheck size={16} /> Open Verification Queue
          </Link>

          <button
            onClick={fetchPharmacies}
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
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'all', label: 'All Pharmacies' },
            { id: 'approved', label: 'Verified' },
            { id: 'pending', label: 'Pending' },
            { id: 'rejected', label: 'Rejected' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === s.id ? '#16a34a' : '#f1f5f9',
                color: statusFilter === s.id ? '#ffffff' : '#475569'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', minWidth: '280px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search pharmacy, license, contact..."
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
              background: '#16a34a',
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

      {/* Directory Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#16a34a' }} />
            Loading pharmacy dispensaries...
          </div>
        ) : pharmacies.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No pharmacy records match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Dispensary Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>License Number</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Contact Person / Phone</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Operational</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Verification State</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map(p => {
                  const statusBadge = getStatusBadge(p.verification_status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dcfce7', color: '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                            <Store size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>
                              {p.pharmacy_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {p.address ? `${p.address.slice(0, 32)}...` : 'Location not set'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: '600', color: '#0f172a' }}>
                        {p.license_number || 'DL-PENDING'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div>{p.contact_person || 'Pharmacist'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{p.phone || 'No phone'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: p.is_24x7 ? '#ecfdf5' : '#f8fafc',
                          color: p.is_24x7 ? '#059669' : '#64748b'
                        }}>
                          {p.is_24x7 ? '24x7 Open' : 'Standard Hours'}
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
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedPharmacy(p)}
                            style={{
                              padding: '6px 10px',
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
                            <Eye size={13} /> View
                          </button>

                          {p.verification_status === 'pending' ? (
                            <Link
                              to="/admin/pharmacy-verification"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                background: '#b45309',
                                color: '#ffffff',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              <ShieldCheck size={13} /> Verify
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleToggleSuspend(p)}
                              disabled={updatingId === p.id}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: p.verification_status === 'suspended' ? '#16a34a' : '#f87171',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              {p.verification_status === 'suspended' ? <UserCheck size={13} /> : <Ban size={13} />}
                              {p.verification_status === 'suspended' ? 'Reactivate' : 'Suspend'}
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

      {/* Pharmacy Details Modal */}
      {selectedPharmacy && (
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
                Dispensary Licensing Record
              </h3>
              <button
                onClick={() => setSelectedPharmacy(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Dispensary ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#334155' }}>{selectedPharmacy.id}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Store Name:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{selectedPharmacy.pharmacy_name}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Drug License No:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#16a34a' }}>{selectedPharmacy.license_number || 'N/A'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Contact Person:</span>
                <span>{selectedPharmacy.contact_person || 'Not recorded'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Phone:</span>
                <span>{selectedPharmacy.phone || 'Not recorded'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Email:</span>
                <span>{selectedPharmacy.email || 'Not recorded'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Address:</span>
                <span>{selectedPharmacy.address || 'Address not registered'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Pincode:</span>
                <span>{selectedPharmacy.pincode || '—'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>24x7 Service:</span>
                <span>{selectedPharmacy.is_24x7 ? 'Yes' : 'No'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Verification:</span>
                <span style={{ fontWeight: '700' }}>{selectedPharmacy.verification_status}</span>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link
                to="/admin/pharmacy-verification"
                style={{ fontSize: '13px', color: '#16a34a', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Verification Queue <ArrowRight size={13} />
              </Link>
              <button
                onClick={() => setSelectedPharmacy(null)}
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
