import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointment.service';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Video, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  AlertCircle, 
  Filter, 
  RefreshCw, 
  ChevronRight, 
  UserX,
  Search
} from 'lucide-react';

export default function DoctorAppointments() {
  const { user, profile } = useAuth();
  const doctorId = profile?.id || user?.id;

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'today' | 'upcoming' | 'completed' | 'cancelled' | 'no_show'
  const [consultationFilter, setConsultationFilter] = useState('all'); // 'all' | 'video' | 'in_person'
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelModal, setCancelModal] = useState({ open: false, apptId: null, reason: '' });
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    if (doctorId) {
      loadAppointments();
    }
  }, [doctorId, activeTab, consultationFilter]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const filters = {};
      
      if (consultationFilter !== 'all') {
        filters.consultationType = consultationFilter;
      }

      if (activeTab === 'today') {
        filters.date = today;
      } else if (activeTab === 'completed') {
        filters.status = 'completed';
      } else if (activeTab === 'cancelled') {
        filters.status = 'cancelled';
      } else if (activeTab === 'no_show') {
        filters.status = 'no_show';
      }

      const data = await appointmentService.getDoctorAppointments(doctorId, filters);
      
      // Client-side filter for 'upcoming' (future dates)
      if (activeTab === 'upcoming') {
        setAppointments(data.filter(a => a.appointment_date > today && a.status !== 'cancelled' && a.status !== 'completed'));
      } else {
        setAppointments(data);
      }
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status, reason = null) => {
    setStatusUpdating(true);
    try {
      await appointmentService.updateStatus(id, status, reason);
      setCancelModal({ open: false, apptId: null, reason: '' });
      await loadAppointments();
    } catch (err) {
      alert('Status update failed: ' + err.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  const filteredAppointments = appointments.filter(appt => {
    if (!searchTerm.trim()) return true;
    const patName = appt.patient?.full_name || '';
    const num = appt.appointment_number || '';
    const sym = appt.symptoms_summary || '';
    return patName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           num.toLowerCase().includes(searchTerm.toLowerCase()) || 
           sym.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ccfbf1', color: '#0f766e', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', marginBottom: '6px' }}>
            <Calendar size={13} /> CLINICAL APPOINTMENT SCHEDULER
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Doctor Appointment Queue & Encounter Triage
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Manage scheduled teleconsultations, conduct video sessions, and record attendance.
          </p>
        </div>

        <button
          onClick={loadAppointments}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} /> Refresh Queue
        </button>
      </div>

      {/* Filter Toolbar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '12px 18px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Appointments' },
            { id: 'today', label: "Today's Schedule" },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' },
            { id: 'no_show', label: 'No-Show' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                background: activeTab === tab.id ? '#0f766e' : '#f1f5f9',
                color: activeTab === tab.id ? '#ffffff' : '#475569'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={consultationFilter}
            onChange={(e) => setConsultationFilter(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              outline: 'none',
              background: '#f8fafc'
            }}
          >
            <option value="all">All Modes</option>
            <option value="video">Video Consultations</option>
            <option value="in_person">In-Person Visits</option>
          </select>

          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search by patient, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                outline: 'none',
                background: '#f8fafc'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw className="animate-spin" size={28} color="#0f766e" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Loading appointment queue...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Calendar size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>No appointments match this filter</h3>
            <p style={{ fontSize: '13px', margin: 0 }}>Adjust status filters or wait for upcoming bookings.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                  <th style={{ padding: '12px 16px' }}>Date & Slot</th>
                  <th style={{ padding: '12px 16px' }}>Patient Details</th>
                  <th style={{ padding: '12px 16px' }}>Mode</th>
                  <th style={{ padding: '12px 16px' }}>Reported Symptoms & Notes</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appt => (
                  <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                      {appt.appointment_date}
                      <span style={{ display: 'block', fontSize: '11.5px', color: '#0f766e', fontWeight: '700' }}>
                        {appt.time_slot}
                      </span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 'normal' }}>
                        {appt.appointment_number}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{appt.patient?.full_name || 'Verified Patient'}</div>
                      <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                        ABHA: {appt.patient?.abha_id || '91-XXXX-XXXX'} • Ph: {appt.patient?.phone || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: appt.consultation_type === 'video' ? '#eff6ff' : '#f1f5f9',
                        color: appt.consultation_type === 'video' ? '#2563eb' : '#475569'
                      }}>
                        {appt.consultation_type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569', maxWidth: '280px' }}>
                      <div>{appt.symptoms_summary || 'General health consult'}</div>
                      {appt.patient_notes && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
                          Note: "{appt.patient_notes}"
                        </div>
                      )}
                      {appt.cancellation_reason && (
                        <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px' }}>
                          Cancelled: {appt.cancellation_reason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: appt.status === 'completed' ? '#dcfce7' : (appt.status === 'cancelled' ? '#fee2e2' : (appt.status === 'no_show' ? '#f3f4f6' : '#fef3c7')),
                        color: appt.status === 'completed' ? '#166534' : (appt.status === 'cancelled' ? '#991b1b' : (appt.status === 'no_show' ? '#4b5563' : '#92400e'))
                      }}>
                        {appt.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <Link
                          to={`/doctor/consultation/${appt.id}`}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#0f766e',
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '11.5px',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Encounter Room <ChevronRight size={12} />
                        </Link>

                        {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(appt.id, 'completed')}
                              disabled={statusUpdating}
                              title="Mark as Completed"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid #16a34a',
                                background: '#f0fdf4',
                                color: '#166534',
                                fontWeight: '700',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Done
                            </button>

                            <button
                              onClick={() => handleStatusChange(appt.id, 'no_show')}
                              disabled={statusUpdating}
                              title="Mark Patient No-Show"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#475569',
                                fontWeight: '700',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              No-Show
                            </button>

                            <button
                              onClick={() => setCancelModal({ open: true, apptId: appt.id, reason: '' })}
                              disabled={statusUpdating}
                              title="Cancel Appointment"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid #fca5a5',
                                background: '#fef2f2',
                                color: '#b91c1c',
                                fontWeight: '700',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {cancelModal.open && (
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
          zIndex: 1000
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '440px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              Cancel Appointment
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Please provide a clear clinical reason for cancelling this appointment. This reason will be recorded in the audit log.
            </p>

            <textarea
              rows="3"
              placeholder="e.g., Doctor called into emergency surgery; patient advised to reschedule."
              value={cancelModal.reason}
              onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '16px',
                fontFamily: 'inherit'
              }}
            ></textarea>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setCancelModal({ open: false, apptId: null, reason: '' })}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: '#f1f5f9',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
              <button
                onClick={() => handleStatusChange(cancelModal.apptId, 'cancelled', cancelModal.reason || 'Doctor rescheduled')}
                disabled={statusUpdating}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: '#dc2626',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                {statusUpdating ? 'Updating...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
