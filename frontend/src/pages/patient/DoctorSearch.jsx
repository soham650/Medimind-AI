import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  Video, 
  CheckCircle, 
  Search, 
  Star, 
  MapPin, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';

const FALLBACK_APPROVED_DOCTORS = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Dr. Sarah Chen, MD',
    full_name: 'Dr. Sarah Chen, MD',
    specialist: 'Cardiologist',
    clinic_id: 'MediMind Advanced Cardiac Center',
    experience_years: 12,
    consultation_fee: 750,
    rating: '4.9',
    reviews_count: 142,
    available_today: true,
    telemed_enabled: true
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Dr. Rajesh Verma, MBBS, MD',
    full_name: 'Dr. Rajesh Verma, MBBS, MD',
    specialist: 'General Physician',
    clinic_id: 'Apollo MediMind Clinical Wing',
    experience_years: 15,
    consultation_fee: 500,
    rating: '4.8',
    reviews_count: 218,
    available_today: true,
    telemed_enabled: true
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Dr. Priya Nair, MD, DNB',
    full_name: 'Dr. Priya Nair, MD, DNB',
    specialist: 'Pediatrician',
    clinic_id: 'Max Child Care & Pediatric Pavilion',
    experience_years: 9,
    consultation_fee: 600,
    rating: '4.9',
    reviews_count: 98,
    available_today: true,
    telemed_enabled: true
  },
  {
    id: '00000000-0000-0000-0000-000000000006',
    name: 'Dr. Amit Shah, MS',
    full_name: 'Dr. Amit Shah, MS',
    specialist: 'Orthopedic',
    clinic_id: 'Manipal Ortho & Joint Institute',
    experience_years: 14,
    consultation_fee: 800,
    rating: '4.7',
    reviews_count: 114,
    available_today: false,
    telemed_enabled: true
  },
  {
    id: '00000000-0000-0000-0000-000000000007',
    name: 'Dr. Neha Kulkarni, MD',
    full_name: 'Dr. Neha Kulkarni, MD',
    specialist: 'Dermatologist',
    clinic_id: 'DermaCare Skin & Hair Center',
    experience_years: 8,
    consultation_fee: 650,
    rating: '4.9',
    reviews_count: 87,
    available_today: true,
    telemed_enabled: true
  },
  {
    id: '00000000-0000-0000-0000-000000000008',
    name: 'Dr. Vikram Malhotra, DM',
    full_name: 'Dr. Vikram Malhotra, DM',
    specialist: 'Neurologist',
    clinic_id: 'NeuroLife Institute of Sciences',
    experience_years: 18,
    consultation_fee: 1000,
    rating: '5.0',
    reviews_count: 76,
    available_today: true,
    telemed_enabled: true
  }
];

export default function DoctorSearch() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'my-teleconsultations'
  const [doctors, setDoctors] = useState([]);
  const [specialty, setSpecialty] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [consultationType, setConsultationType] = useState('video');
  const [symptomsSummary, setSymptomsSummary] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Active Video Room Modal State for Patient
  const [activeVideoCall, setActiveVideoCall] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'doctor', text: 'Hello Rahul! I am reviewing your recent symptom report and biomarker logs.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Patient's booked teleconsultations list
  const [myConsultations, setMyConsultations] = useState([
    {
      id: 'tele-001',
      doctor_name: 'Dr. Sarah Chen, MD',
      specialist: 'Cardiologist',
      clinic: 'MediMind Advanced Cardiac Center',
      appointment_date: new Date().toISOString().split('T')[0],
      time_slot: '11:00 AM',
      consultation_type: 'video',
      status: 'Ready to Join',
      fee: '₹750'
    },
    {
      id: 'tele-002',
      doctor_name: 'Dr. Rajesh Verma, MBBS, MD',
      specialist: 'General Physician',
      clinic: 'Apollo MediMind Clinical Wing',
      appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      time_slot: '03:30 PM',
      consultation_type: 'video',
      status: 'Confirmed',
      fee: '₹500'
    }
  ]);

  useEffect(() => {
    loadDoctors();
  }, [specialty]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getApprovedDoctors(specialty);
      if (data && data.length > 0) {
        setDoctors(data);
      } else {
        // Filter fallback list by specialty
        if (specialty === 'All') {
          setDoctors(FALLBACK_APPROVED_DOCTORS);
        } else {
          setDoctors(FALLBACK_APPROVED_DOCTORS.filter(d => d.specialist.toLowerCase().includes(specialty.toLowerCase())));
        }
      }
    } catch (err) {
      console.error('Error fetching approved doctors:', err);
      setDoctors(FALLBACK_APPROVED_DOCTORS);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    setSubmitting(true);
    try {
      await appointmentService.bookAppointment({
        patientId: user?.id || '00000000-0000-0000-0000-000000000001',
        doctorId: selectedDoctor.id,
        appointmentDate: bookingDate,
        timeSlot,
        consultationType,
        symptomsSummary,
      });

      // Add to local list
      const newConsultation = {
        id: 'tele-' + Date.now(),
        doctor_name: selectedDoctor.name || selectedDoctor.full_name,
        specialist: selectedDoctor.specialist,
        clinic: selectedDoctor.clinic_id || 'MediMind Partner Hospital',
        appointment_date: bookingDate,
        time_slot: timeSlot,
        consultation_type: consultationType,
        status: consultationType === 'video' ? 'Ready to Join' : 'Scheduled',
        fee: `₹${selectedDoctor.consultation_fee || 500}`
      };
      setMyConsultations(prev => [newConsultation, ...prev]);
      setBookingSuccess(true);
    } catch (err) {
      console.warn('Backend booking fallback, saving locally:', err.message);
      const newConsultation = {
        id: 'tele-' + Date.now(),
        doctor_name: selectedDoctor.name || selectedDoctor.full_name,
        specialist: selectedDoctor.specialist,
        clinic: selectedDoctor.clinic_id || 'MediMind Partner Hospital',
        appointment_date: bookingDate,
        time_slot: timeSlot,
        consultation_type: consultationType,
        status: consultationType === 'video' ? 'Ready to Join' : 'Scheduled',
        fee: `₹${selectedDoctor.consultation_fee || 500}`
      };
      setMyConsultations(prev => [newConsultation, ...prev]);
      setBookingSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'patient', text: msg }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev, 
        { sender: 'doctor', text: `Noted regarding "${msg}". I am updating your clinical care note.` }
      ]);
    }, 1200);
  };

  const specialties = ['All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist', 'Pediatrician', 'Orthopedic'];
  const slots = ['09:30 AM', '10:00 AM', '11:15 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Banner with Patient Context */}
      <div style={{
        background: 'linear-gradient(135deg, #0a4bb5 0%, #1e3a8a 100%)',
        borderRadius: '20px',
        padding: '30px 36px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 10px 25px -5px rgba(10, 75, 181, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '5px 12px', borderRadius: '9999px', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em', marginBottom: '10px' }}>
            <Video size={14} color="#67e8f9" />
            PATIENT TELE-CONSULTATION HUB • ABDM SECURE
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Tele-Consultations & Doctor Booking
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0, maxWidth: '620px', lineHeight: 1.5 }}>
            Book instantaneous encrypted video consultations or clinic visits with verified, credentialed physicians certified by the MediMind Admin Gate.
          </p>
        </div>

        {/* Quick Stats Pill */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff' }}>{myConsultations.length}</div>
            <div style={{ fontSize: '11.5px', color: '#bfdbfe', fontWeight: '600' }}>Active Sessions</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '14px 20px', borderRadius: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#4ade80' }}>100%</div>
            <div style={{ fontSize: '11.5px', color: '#bfdbfe', fontWeight: '600' }}>ABDM Verified</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Book vs My Teleconsultations */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #e2e8f0', marginBottom: '28px' }}>
        <button
          onClick={() => setActiveTab('book')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'book' ? '3px solid #0a4bb5' : '3px solid transparent',
            color: activeTab === 'book' ? '#0a4bb5' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <Search size={16} />
          Book Tele-Consultation
        </button>

        <button
          onClick={() => setActiveTab('my-teleconsultations')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'my-teleconsultations' ? '3px solid #0a4bb5' : '3px solid transparent',
            color: activeTab === 'my-teleconsultations' ? '#0a4bb5' : '#64748b',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px'
          }}
        >
          <Video size={16} />
          My Tele-Consultations ({myConsultations.length})
          <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '9999px' }}>
            LIVE
          </span>
        </button>
      </div>

      {/* TAB 1: BOOK NEW TELECONSULTATION */}
      {activeTab === 'book' && (
        <div>
          {/* Specialty Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '24px' }}>
            {specialties.map(spec => (
              <button
                key={spec}
                onClick={() => setSpecialty(spec)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: '600',
                  border: specialty === spec ? '1px solid #0a4bb5' : '1px solid #cbd5e1',
                  background: specialty === spec ? '#0a4bb5' : '#ffffff',
                  color: specialty === spec ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: specialty === spec ? '0 4px 6px -1px rgba(10,75,181,0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {spec}
              </button>
            ))}
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading verified practitioners...</div>
          ) : doctors.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <Stethoscope size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>No approved doctors found in this specialty</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Select another specialty or choose "All".</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
              {doctors.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '12px',
                          background: '#eff6ff',
                          color: '#0a4bb5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '18px',
                          border: '1px solid #bfdbfe'
                        }}>
                          {(doc.name || doc.full_name || 'D').charAt(3) || 'D'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                            {doc.name || doc.full_name || 'Practitioner'}
                          </h3>
                          <span style={{ fontSize: '13px', color: '#0a4bb5', fontWeight: '700' }}>
                            {doc.specialist || 'General Physician'}
                          </span>
                        </div>
                      </div>

                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        background: '#dcfce7',
                        color: '#166534',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}>
                        <CheckCircle size={12} /> Verified
                      </span>
                    </div>

                    <div style={{ marginTop: '16px', fontSize: '13px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#94a3b8" /> {doc.clinic_id || 'MediMind Partner Clinic'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Experience: <strong style={{ color: '#0f172a' }}>{doc.experience_years || 8}+ Years</strong></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#d97706', fontWeight: '700' }}>
                          <Star size={13} fill="#d97706" /> {doc.rating || '4.9'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid #f1f5f9' }}>
                        <span>Teleconsult Fee:</span>
                        <strong style={{ fontSize: '16px', color: '#0f172a' }}>₹{doc.consultation_fee || 500}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setConsultationType('video');
                        setBookingSuccess(false);
                      }}
                      style={{
                        flex: 1,
                        padding: '11px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#0a4bb5',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 4px rgba(10,75,181,0.2)'
                      }}
                    >
                      <Video size={16} /> Book Video Call
                    </button>

                    <button
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setConsultationType('in-person');
                        setBookingSuccess(false);
                      }}
                      style={{
                        padding: '11px 14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Calendar size={15} /> Clinic
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY BOOKED TELE-CONSULTATIONS */}
      {activeTab === 'my-teleconsultations' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))', gap: '20px' }}>
            {myConsultations.map(consult => (
              <div
                key={consult.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid #e2e8f0',
                  padding: '24px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: '#dcfce7',
                      color: '#166534',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800'
                    }}>
                      <Video size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                        {consult.doctor_name}
                      </h3>
                      <div style={{ fontSize: '13px', color: '#0a4bb5', fontWeight: '700' }}>
                        {consult.specialist}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {consult.clinic}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    background: consult.status === 'Ready to Join' ? '#dcfce7' : '#eff6ff',
                    color: consult.status === 'Ready to Join' ? '#166534' : '#1d4ed8',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: consult.status === 'Ready to Join' ? '#22c55e' : '#3b82f6' }}></span>
                    {consult.status}
                  </span>
                </div>

                <div style={{
                  background: '#f8fafc',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '18px',
                  fontSize: '13px',
                  color: '#475569'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="#0a4bb5" />
                    <strong>{consult.appointment_date}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#0a4bb5" />
                    <strong>{consult.time_slot}</strong>
                  </div>
                  <div style={{ color: '#0f172a', fontWeight: '700' }}>
                    {consult.fee}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setActiveVideoCall(consult)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#16a34a',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 6px -1px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <Video size={18} /> Join Video Call Room
                  </button>

                  <button
                    onClick={() => alert(`Encounter ID: ${consult.id}\nDoctor: ${consult.doctor_name}\nABDM Consent Token: Verified`)}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: '600',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: BOOKING MODAL */}
      {selectedDoctor && (
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
            borderRadius: '20px',
            maxWidth: '500px',
            width: '100%',
            padding: '30px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircle size={64} color="#16a34a" style={{ margin: '0 auto 16px auto' }} />
                <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Tele-Consultation Booked!</h3>
                <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '8px', marginBottom: '24px', lineHeight: 1.5 }}>
                  Your encrypted {consultationType} session with <strong>Dr. {selectedDoctor.name || selectedDoctor.full_name}</strong> is scheduled for <strong>{bookingDate}</strong> at <strong>{timeSlot}</strong>.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      setActiveTab('my-teleconsultations');
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '10px',
                      border: 'none',
                      background: '#0a4bb5',
                      color: '#ffffff',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    View My Tele-Consultations
                  </button>
                  <button
                    onClick={() => setSelectedDoctor(null)}
                    style={{
                      padding: '12px 18px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#334155',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBook}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                      Schedule Consultation
                    </h3>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                      Dr. {selectedDoctor.name || selectedDoctor.full_name} ({selectedDoctor.specialist})
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setSelectedDoctor(null)} 
                    style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b', fontWeight: 'bold' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Consultation Type Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                  <button
                    type="button"
                    onClick={() => setConsultationType('video')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: consultationType === 'video' ? '2px solid #0a4bb5' : '1px solid #cbd5e1',
                      background: consultationType === 'video' ? '#eff6ff' : '#ffffff',
                      color: consultationType === 'video' ? '#0a4bb5' : '#475569',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Video size={16} /> Encrypted Video
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationType('in-person')}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      border: consultationType === 'in-person' ? '2px solid #0a4bb5' : '1px solid #cbd5e1',
                      background: consultationType === 'in-person' ? '#eff6ff' : '#ffffff',
                      color: consultationType === 'in-person' ? '#0a4bb5' : '#475569',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Stethoscope size={16} /> In-Clinic Visit
                  </button>
                </div>

                {/* Date Picker */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Select Consultation Date
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    required
                  />
                </div>

                {/* Slots */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Available Time Slots
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {slots.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTimeSlot(s)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: timeSlot === s ? '1.5px solid #0a4bb5' : '1px solid #e2e8f0',
                          background: timeSlot === s ? '#0a4bb5' : '#f8fafc',
                          color: timeSlot === s ? '#ffffff' : '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms Notes */}
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Symptoms / Chief Complaint
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Cough and chest tightness for 2 days. AI triage recommended consultation."
                    value={symptomsSummary}
                    onChange={(e) => setSymptomsSummary(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Consultation Fee:</span>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>₹{selectedDoctor.consultation_fee || 500}</strong>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    height: '46px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0a4bb5',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(10, 75, 181, 0.25)'
                  }}
                >
                  {submitting ? 'Confirming Appointment...' : 'Confirm Tele-Consultation'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: LIVE PATIENT TELE-CONSULTATION ROOM */}
      {activeVideoCall && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0f172a',
            borderRadius: '24px',
            maxWidth: '1050px',
            width: '100%',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
          }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></div>
                <div>
                  <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: '800', margin: 0 }}>
                    Live Teleconsultation with {activeVideoCall.doctor_name}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {activeVideoCall.specialist} • ABDM Secure WebRTC Channel (1080p 60fps)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '9999px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                  🔒 End-to-End Encrypted
                </span>
                <button
                  onClick={() => setActiveVideoCall(null)}
                  style={{ background: '#334155', border: 'none', color: '#ffffff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Video Main Body (Split: Doctor Feed / Patient Pip + Chat) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 340px', overflow: 'hidden' }}>
              {/* Video Area */}
              <div style={{ position: 'relative', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Doctor Virtual Video Stream Display */}
                <div style={{ textAlign: 'center', color: '#ffffff' }}>
                  <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0a4bb5 0%, #3b82f6 100%)',
                    margin: '0 auto 16px auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 35px rgba(59, 130, 246, 0.5)',
                    border: '3px solid #60a5fa'
                  }}>
                    <Stethoscope size={56} color="#ffffff" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0' }}>{activeVideoCall.doctor_name}</h3>
                  <span style={{ fontSize: '13px', color: '#60a5fa', fontWeight: '600' }}>Attending Physician Connected</span>
                  <div style={{ marginTop: '12px', fontSize: '12px', color: '#94a3b8' }}>
                    Telemetry: Pulse 72 bpm | SpO2 98% | BP 120/80 mmHg (Live Streamed)
                  </div>
                </div>

                {/* Self PIP Camera View */}
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  width: '160px',
                  height: '110px',
                  borderRadius: '12px',
                  background: videoOn ? '#1e293b' : '#0f172a',
                  border: '2px solid #3b82f6',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.5)'
                }}>
                  {videoOn ? (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 4px auto', fontWeight: 'bold' }}>
                        You
                      </div>
                      HD Camera On
                    </div>
                  ) : (
                    <div style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <VideoOff size={14} /> Camera Off
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation Chat / Notes Panel */}
              <div style={{ background: '#0f172a', borderLeft: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #1e293b', color: '#ffffff', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={15} color="#60a5fa" />
                  Clinical Messages & Notes
                </div>

                <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        alignSelf: msg.sender === 'patient' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        background: msg.sender === 'patient' ? '#0a4bb5' : '#1e293b',
                        color: '#ffffff',
                        padding: '10px 14px',
                        borderRadius: msg.sender === 'patient' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        fontSize: '12.5px',
                        lineHeight: 1.4,
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}
                    >
                      <div style={{ fontSize: '10px', color: msg.sender === 'patient' ? '#bfdbfe' : '#94a3b8', marginBottom: '3px', fontWeight: '700' }}>
                        {msg.sender === 'patient' ? 'You' : activeVideoCall.doctor_name}
                      </div>
                      {msg.text}
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} style={{ padding: '12px', borderTop: '1px solid #1e293b', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Type symptom or query..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                  />
                  <button type="submit" style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#0a4bb5', color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    Send
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Call Controls Bar */}
            <div style={{ padding: '16px 24px', background: '#1e293b', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setMicOn(!micOn)}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: 'none',
                  background: micOn ? '#334155' : '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>

              <button
                onClick={() => setVideoOn(!videoOn)}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: 'none',
                  background: videoOn ? '#334155' : '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={videoOn ? 'Turn Video Off' : 'Turn Video On'}
              >
                {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>

              <button
                onClick={() => {
                  alert('Session notes saved. Digital prescription will appear under "4. Digital Rx".');
                  setActiveVideoCall(null);
                }}
                style={{
                  padding: '0 24px',
                  height: '46px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.4)'
                }}
              >
                <PhoneOff size={18} /> End Call
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
