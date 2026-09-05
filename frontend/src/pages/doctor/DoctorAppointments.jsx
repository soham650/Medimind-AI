import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { Link } from 'react-router-dom';
import { Calendar, Video, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function DoctorAppointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadAppointments();
    }
  }, [profile]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getDoctorAppointments(profile.id);
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id, status) => {
    try {
      await appointmentService.updateStatus(id, status);
      await loadAppointments();
    } catch (err) {
      alert('Status update failed: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
          Doctor Appointment Queue & Schedule
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Manage booked teleconsultations, initiate clinical sessions, or mark attendance.
        </p>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
            <Calendar size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>No patient appointments booked yet</h3>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Patients can book slots with your profile once approved by the Admin Gate.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Date & Time</th>
                <th style={{ padding: '12px 16px' }}>Patient</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Reported Symptoms</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appt => (
                <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                    {appt.appointment_date}
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '400', color: '#64748b' }}>
                      {appt.time_slot}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{appt.patient?.full_name || 'Verified Patient'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Age: {appt.patient?.age || 30} | {appt.patient?.gender || 'Male'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '700' }}>
                      {appt.consultation_type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569', maxWidth: '240px' }}>
                    {appt.symptoms_summary || 'General health consultation'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '9999px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background: appt.status === 'completed' ? '#dcfce7' : (appt.status === 'cancelled' ? '#fee2e2' : '#fef3c7'),
                      color: appt.status === 'completed' ? '#166534' : (appt.status === 'cancelled' ? '#991b1b' : '#92400e')
                    }}>
                      {appt.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Link
                        to={`/doctor/consultation/${appt.id}`}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: '#0a4bb5',
                          color: '#ffffff',
                          fontWeight: '700',
                          fontSize: '11px',
                          textDecoration: 'none'
                        }}
                      >
                        Enter Room
                      </Link>
                      {appt.status === 'scheduled' && (
                        <button
                          onClick={() => handleStatus(appt.id, 'completed')}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid #16a34a',
                            background: '#f0fdf4',
                            color: '#166534',
                            fontWeight: '700',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Done
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
