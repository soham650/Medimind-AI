import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Stethoscope,
  Building,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileText
} from 'lucide-react';

export default function PatientAppointments() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('upcoming'); // 'all' | 'upcoming' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchAppointments = async () => {
    if (!user && !profile) {
      setLoading(false);
      return;
    }
    const patientId = profile?.id || user?.id;
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getPatientAppointments(patientId);
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching patient appointments:', err);
      setError(err.message || 'Unable to load your appointment history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user, profile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingId) return;
    try {
      await appointmentService.updateStatus(cancellingId, 'cancelled', cancelReason || 'Cancelled by patient');
      showToast('Appointment successfully cancelled.');
      setShowCancelModal(false);
      setCancellingId(null);
      setCancelReason('');
      await fetchAppointments();
    } catch (err) {
      alert('Failed to cancel appointment: ' + err.message);
    }
  };

  const isUpcoming = (status) => ['requested', 'confirmed', 'in_progress'].includes(status);

  const filteredAppointments = appointments.filter((appt) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'upcoming' && isUpcoming(appt.status)) ||
      (filter === 'completed' && appt.status === 'completed') ||
      (filter === 'cancelled' && (appt.status === 'cancelled' || appt.status === 'no_show'));

    const matchesSearch =
      (appt.doctor?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.doctor?.specialization || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (appt.appointment_number || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#dcfce7', color: '#15803d', label: 'Confirmed', icon: CheckCircle2 };
      case 'requested':
        return { bg: '#ede9fe', color: '#6d28d9', label: 'Booking Requested', icon: Clock };
      case 'in_progress':
        return { bg: '#eff6ff', color: '#1d4ed8', label: 'In Consultation', icon: Video };
      case 'completed':
        return { bg: '#f1f5f9', color: '#334155', label: 'Consultation Completed', icon: ShieldCheck };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled', icon: XCircle };
      default:
        return { bg: '#f8fafc', color: '#64748b', label: status, icon: Clock };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: '700', fontSize: '13px' }}>
            <Calendar size={18} /> CLINICAL APPOINTMENTS
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            My Clinical Consultations
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            View and manage your scheduled doctor consultations, join encrypted video sessions, and inspect consultation history.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchAppointments}
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
            <RefreshCw size={15} /> Refresh
          </button>
          <Link
            to="/doctors"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: '#0a4bb5',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '700',
              boxShadow: '0 2px 4px rgba(10, 75, 181, 0.2)'
            }}
          >
            <Plus size={16} /> Book New Appointment
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search */}
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
            { key: 'upcoming', label: 'Upcoming / Scheduled' },
            { key: 'all', label: `All Visits (${appointments.length})` },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: filter === tab.key ? '#0a4bb5' : '#f1f5f9',
                color: filter === tab.key ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 12px',
            width: '100%'
          }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by doctor or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                paddingLeft: '8px',
                fontSize: '13px',
                width: '100%',
                color: '#1e293b'
              }}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '60px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Loading your consultation schedule...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{
          padding: '24px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b',
          marginBottom: '24px'
        }}>
          <AlertCircle size={24} />
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '14px' }}>Unable to load appointments</h4>
            <p style={{ fontSize: '13px', color: '#b91c1c', marginTop: '2px' }}>{error}</p>
          </div>
          <button
            onClick={fetchAppointments}
            style={{ marginLeft: 'auto', padding: '6px 12px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAppointments.length === 0 && (
        <div style={{
          padding: '64px 24px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <Calendar size={56} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Appointments Found</h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '8px auto 24px auto' }}>
            {filter === 'upcoming'
              ? "You don't have any upcoming clinical consultations scheduled. Find a specialist to book an appointment."
              : 'No appointments match the selected filter.'}
          </p>
          <Link
            to="/doctors"
            style={{
              padding: '10px 24px',
              background: '#0a4bb5',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '700'
            }}
          >
            Find & Book a Doctor
          </Link>
        </div>
      )}

      {/* Appointments Grid */}
      {!loading && !error && filteredAppointments.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredAppointments.map((appt) => {
            const badge = getStatusBadge(appt.status);
            const BadgeIcon = badge.icon;
            const canCancel = isUpcoming(appt.status);

            return (
              <div
                key={appt.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div>
                  {/* Top Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: badge.bg,
                      color: badge.color
                    }}>
                      <BadgeIcon size={13} /> {badge.label}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>
                      {appt.appointment_number || 'APT-ONLINE'}
                    </span>
                  </div>

                  {/* Doctor Info */}
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0a4bb5',
                      fontWeight: '800',
                      fontSize: '18px'
                    }}>
                      <Stethoscope size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                        {appt.doctor?.full_name || 'Medical Specialist'}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600' }}>
                        {appt.doctor?.specialization || 'General Physician'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {appt.doctor?.clinic_name || 'MediMind Clinical Centre'}
                      </p>
                    </div>
                  </div>

                  {/* Date & Time Slot Box */}
                  <div style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '10px',
                    border: '1px solid #f1f5f9',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Calendar size={15} color="#0a4bb5" />
                      <strong>Date:</strong> {appt.appointment_date}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Clock size={15} color="#0a4bb5" />
                      <strong>Time Slot:</strong> {appt.time_slot || '10:00 AM'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#334155' }}>
                      <Video size={15} color="#0a4bb5" />
                      <strong>Mode:</strong> {appt.consultation_type === 'in_person' ? 'In-Person Hospital Visit' : 'Encrypted Video Teleconsultation'}
                    </div>
                  </div>

                  {/* Symptoms Summary */}
                  {appt.symptoms_summary && (
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                        Chief Complaint / Symptoms:
                      </span>
                      <p style={{ fontSize: '13px', color: '#334155', marginTop: '2px', background: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #f1f5f9' }}>
                        {appt.symptoms_summary}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {isUpcoming(appt.status) && (
                    <Link
                      to={`/doctor/consultation/${appt.id}`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        background: '#0a4bb5',
                        color: '#ffffff',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      <Video size={15} /> Join Teleconsultation
                    </Link>
                  )}

                  {canCancel && (
                    <button
                      onClick={() => {
                        setCancellingId(appt.id);
                        setShowCancelModal(true);
                      }}
                      style={{
                        padding: '9px 14px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        color: '#b91c1c',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  )}

                  {appt.status === 'completed' && (
                    <Link
                      to="/prescriptions"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '9px 12px',
                        background: '#f1f5f9',
                        color: '#0a4bb5',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      <FileText size={15} /> View Prescription
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              Cancel Appointment
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Are you sure you wish to cancel this scheduled consultation? The doctor will be notified immediately.
            </p>

            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Reason for Cancellation (Optional):
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Symptoms resolved, rescheduling for another day..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                marginBottom: '20px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancellingId(null);
                }}
                style={{
                  padding: '9px 16px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                style={{
                  padding: '9px 18px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
