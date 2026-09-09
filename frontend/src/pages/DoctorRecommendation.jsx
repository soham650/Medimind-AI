import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorService, appointmentService } from '../services';
import { Stethoscope, Star, CheckCircle, ShieldAlert, Calendar, Clock, AlertCircle } from 'lucide-react';

export default function DoctorRecommendation() {
  const { user } = useAuth();
  const [specialists] = useState([
    'General Physician',
    'Cardiologist',
    'Pulmonologist',
    'Neurologist',
    'Pediatrician',
    'Dermatologist',
    'Orthopedic'
  ]);
  const [selectedSpecialist, setSelectedSpecialist] = useState('General Physician');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingSlot, setBookingSlot] = useState('10:00 AM');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookingError, setBookingError] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setDoctors([]);
    try {
      const data = await doctorService.getRecommendedDoctors(selectedSpecialist);
      setDoctors(data || []);
    } catch (err) {
      console.error('Error fetching doctor recommendations:', err);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedSpecialist]);

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    if (!user?.id) {
      setBookingError('Authentication required: Please sign in with a patient account to book an appointment.');
      return;
    }

    setBookingSubmitting(true);
    setBookingError(null);
    try {
      const docId = bookingDoctor.doctor_id || bookingDoctor.id;
      await appointmentService.createAppointment({
        doctorId: docId,
        appointmentDate: bookingDate,
        timeSlot: bookingSlot,
        consultationType: 'online',
        symptomsSummary: `Referred via Specialty Recommendation Engine for ${selectedSpecialist}`,
        patientNotes: 'Booking via AI Recommendation'
      });

      setBookingStatus(`Appointment successfully scheduled with Dr. ${bookingDoctor.full_name || bookingDoctor.name} on ${bookingDate} at ${bookingSlot}!`);
      setBookingDoctor(null);
      setTimeout(() => setBookingStatus(null), 5000);
    } catch (err) {
      setBookingError(err.message || 'Unable to book slot. It may already be reserved.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ padding: '24px 32px 60px 32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
          <Stethoscope size={14} /> AI-ASSISTED CLINICAL SPECIALIST MATCHING
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
          Clinician & Specialist Match
        </h2>
        <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px', maxWidth: '720px' }}>
          Match with verified, ABDM-registered healthcare practitioners using transactional appointment booking.
        </p>
      </div>

      {/* Clinical Safety Protocol Alert */}
      <div style={{
        marginTop: '18px',
        padding: '14px 18px',
        background: '#fffbeb',
        border: '1px solid #fef3c7',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '12.5px',
        color: '#92400e',
        lineHeight: 1.5
      }}>
        <ShieldAlert size={18} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Clinical Safety Protocol:</strong> AI-assisted preliminary assessment. Possible condition matching. Risk assessment support only. Doctor review recommended. MediMind AI does not provide definitive medical diagnoses or autonomous medication prescriptions.
        </div>
      </div>

      {/* Main Card */}
      <div className="card" style={{ marginTop: '20px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Select Specialty Category</h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Filters verified physicians by medical department</span>
          </div>
          <select 
            className="form-input" 
            value={selectedSpecialist} 
            onChange={e => setSelectedSpecialist(e.target.value)}
            style={{ width: '240px', padding: '8px 12px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#f8fafc', fontWeight: '600' }}
          >
            {specialists.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
          </select>
        </div>

        {bookingStatus && (
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} color="#166534" />
            <span>{bookingStatus}</span>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#0a4bb5', fontWeight: 'bold' }}>
            Searching clinical network for verified {selectedSpecialist} specialists...
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
            No verified specialists currently available in this specialty. Try selecting "General Physician" or checking back later.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {doctors.map((doc, idx) => {
              const docId = doc.doctor_id || doc.id;
              const docName = doc.full_name || doc.name || 'Practitioner';
              const docSpec = doc.specialization || doc.specialist || selectedSpecialist;
              const fee = doc.consultation_fee || 500;
              const rating = doc.rating || 4.9;

              return (
                <div 
                  key={docId || idx} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '18px 22px',
                    background: '#ffffff',
                    transition: 'border-color 0.15s ease',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#eff6ff',
                      color: '#0a4bb5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: '16px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <Stethoscope size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{docName}</h4>
                        <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>Verified</span>
                      </div>
                      <span style={{ fontSize: '12.5px', color: '#0a4bb5', fontWeight: '700' }}>{docSpec}</span>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span>📍 {doc.clinic_name || 'MediMind Healthcare Network'}</span>
                        <span>⭐ <strong>{rating}</strong> Rating</span>
                        <span>Fee: <strong>₹{fee}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setBookingDoctor(doc);
                      setBookingError(null);
                    }}
                    style={{
                      background: '#0a4bb5',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 18px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(10, 75, 181, 0.2)'
                    }}
                  >
                    <Calendar size={15} /> Book Appointment
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Confirm Appointment</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                  Dr. {bookingDoctor.full_name || bookingDoctor.name} ({bookingDoctor.specialization || bookingDoctor.specialist})
                </p>
              </div>
              <button 
                onClick={() => setBookingDoctor(null)}
                style={{ border: 'none', background: '#f1f5f9', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            {bookingError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '12.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={15} color="#b91c1c" style={{ flexShrink: 0 }} />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Appointment Date
                </label>
                <input 
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                  Time Slot
                </label>
                <select
                  value={bookingSlot}
                  onChange={e => setBookingSlot(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                >
                  {['09:30 AM', '10:00 AM', '11:15 AM', '02:00 PM', '03:30 PM', '05:00 PM'].map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Consultation Fee:</span>
                  <strong style={{ color: '#0f172a' }}>₹{bookingDoctor.consultation_fee || 500}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Transaction Security:</span>
                  <span style={{ color: '#16a34a', fontWeight: '700' }}>Atomic DB Lock (Anti-Double-Booking)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  style={{
                    flex: 1,
                    background: '#0a4bb5',
                    color: '#ffffff',
                    border: 'none',
                    padding: '11px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    opacity: bookingSubmitting ? 0.7 : 1
                  }}
                >
                  {bookingSubmitting ? 'Securing Slot...' : 'Confirm Appointment'}
                </button>
                <button
                  type="button"
                  onClick={() => setBookingDoctor(null)}
                  style={{
                    padding: '11px 16px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
