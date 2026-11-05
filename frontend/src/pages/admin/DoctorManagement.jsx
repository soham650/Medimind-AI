import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  ShieldCheck,
  Award,
  Ban,
  UserCheck,
  Star,
  DollarSign,
  ArrowRight,
  X,
  Trash2
} from 'lucide-react';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDoctors({
        status: statusFilter,
        search: searchQuery,
        limit: 100
      });
      setDoctors(res.doctors);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Error fetching doctors directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  const handleToggleSuspend = async (doc) => {
    const isSuspended = doc.verification_status === 'suspended';
    const nextStatus = isSuspended ? 'approved' : 'suspended';
    if (!window.confirm(`${isSuspended ? 'Reactivate' : 'Suspend'} Dr. ${doc.full_name}?`)) return;

    setUpdatingId(doc.id);
    try {
      if (isSuspended) {
        await adminService.reactivateUser(doc.id);
      } else {
        await adminService.suspendUser(doc.id, 'Administrative suspension from Doctor Directory');
      }
      await fetchDoctors();
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveDoctor = async (doc) => {
    if (!window.confirm(`Approve Dr. ${doc.full_name}? They will receive an SMS/Email alert and be authorized to log in.`)) return;
    setUpdatingId(doc.id);
    try {
      await adminService.verifyDoctor(doc.id, 'approved');
      alert(`Dr. ${doc.full_name} has been approved! Confirmation SMS & email notification dispatched.`);
      await fetchDoctors();
    } catch (err) {
      alert('Approval failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteDoctor = async (doc) => {
    if (!window.confirm(`Are you sure you want to PERMANENTLY REMOVE Dr. ${doc.full_name}?\n\nThis will delete their doctor record, account, and listings completely.`)) return;
    setUpdatingId(doc.id);
    try {
      await adminService.deleteDoctor(doc.id);
      alert(`Dr. ${doc.full_name} has been permanently removed.`);
      await fetchDoctors();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', color: '#15803d', label: 'Approved & Active', icon: CheckCircle2 };
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#eff6ff', borderRadius: '6px', color: '#2563eb', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Stethoscope size={16} /> Practitioner Directory & Oversight
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Medical Doctor Directory
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Directory of physicians, specialists, clinical experience, consultation fees, and practice status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/admin/doctor-verification"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: '#d97706',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            <ShieldCheck size={16} /> Open Verification Queue
          </Link>

          <button
            onClick={fetchDoctors}
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
            { id: 'all', label: 'All Doctors' },
            { id: 'approved', label: 'Approved' },
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
                background: statusFilter === s.id ? '#2563eb' : '#f1f5f9',
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
              placeholder="Search by name, specialization..."
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
              background: '#2563eb',
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
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#2563eb' }} />
            Loading doctor profiles...
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No practitioner records match the selected filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Practitioner Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Specialization</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Experience / Degree</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Fee</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Verification State</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map(d => {
                  const statusBadge = getStatusBadge(d.verification_status);
                  const StatusIcon = statusBadge.icon;

                  return (
                    <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                            <Stethoscope size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>
                              Dr. {d.full_name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              {d.phone || 'Phone not set'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#1e40af', fontWeight: '600' }}>
                        {d.specialization || 'General Medicine'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#475569' }}>
                        <div>{d.experience_years ? `${d.experience_years} years` : 'Experience N/A'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.qualification || 'MBBS'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                        ₹{d.consultation_fee || 500}
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
                            onClick={() => setSelectedDoctor(d)}
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

                          {d.verification_status === 'pending' && (
                            <button
                              onClick={() => handleApproveDoctor(d)}
                              disabled={updatingId === d.id}
                              title="Approve doctor credentials"
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#16a34a',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              <CheckCircle2 size={13} /> Approve
                            </button>
                          )}

                          {d.verification_status !== 'pending' && (
                            <button
                              onClick={() => handleToggleSuspend(d)}
                              disabled={updatingId === d.id}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                background: d.verification_status === 'suspended' ? '#0f766e' : '#f59e0b',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: '700'
                              }}
                            >
                              {d.verification_status === 'suspended' ? <UserCheck size={13} /> : <Ban size={13} />}
                              {d.verification_status === 'suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteDoctor(d)}
                            disabled={updatingId === d.id}
                            title="Delete doctor permanently"
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#ef4444',
                              color: '#ffffff',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}
                          >
                            <Trash2 size={13} /> Remove
                          </button>
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

      {/* Doctor Profile Modal */}
      {selectedDoctor && (
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
                Practitioner Professional Profile
              </h3>
              <button
                onClick={() => setSelectedDoctor(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Doctor ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#334155' }}>{selectedDoctor.id}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Full Name:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>Dr. {selectedDoctor.full_name}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Specialization:</span>
                <span style={{ fontWeight: '600', color: '#1e40af' }}>{selectedDoctor.specialization}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Qualifications:</span>
                <span>{selectedDoctor.qualification || 'MBBS'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Experience:</span>
                <span>{selectedDoctor.experience_years ? `${selectedDoctor.experience_years} years` : 'N/A'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Consultation Fee:</span>
                <span style={{ fontWeight: '700' }}>₹{selectedDoctor.consultation_fee || 500}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Verification:</span>
                <span>{selectedDoctor.verification_status}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Phone:</span>
                <span>{selectedDoctor.phone || 'Not recorded'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Bio:</span>
                <span style={{ color: '#475569', fontStyle: 'italic' }}>{selectedDoctor.bio || 'No bio provided'}</span>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link
                to="/admin/doctor-verification"
                style={{ fontSize: '13px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Verification Queue <ArrowRight size={13} />
              </Link>
              <button
                onClick={() => setSelectedDoctor(null)}
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
