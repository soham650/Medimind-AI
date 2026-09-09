import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctor.service';
import { Link } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Video, 
  FilePlus2, 
  Activity, 
  ChevronRight, 
  Bell, 
  Search, 
  RefreshCw,
  SlidersHorizontal,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Eye,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function DoctorDashboard() {
  const { user, profile } = useAuth();
  const doctorId = profile?.id || user?.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [filterTab, setFilterTab] = useState('today'); // 'today' | 'upcoming' | 'patients'
  const [searchTerm, setSearchTerm] = useState('');

  const loadDashboard = async () => {
    if (!doctorId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await doctorService.getMissionControlData(doctorId);
      setData(res);
    } catch (err) {
      console.error('Failed to load mission control data:', err);
      setError(err.message || 'Unable to connect to live Supabase clinical telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [doctorId]);

  if (loading) {
    return (
      <div style={{
        padding: '80px',
        textAlign: 'center',
        background: '#f8fafc',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <RefreshCw className="animate-spin" size={36} color="#0f766e" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
          Hydrating Doctor Mission Control
        </h3>
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
          Connecting to live Supabase appointments, clinical access bridge, and telemetry...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
          <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#991b1b', margin: '0 0 6px 0' }}>Clinical Telemetry Connection Error</h3>
          <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 16px 0' }}>{error}</p>
          <button 
            onClick={loadDashboard}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#0f766e',
              color: '#ffffff',
              border: 'none',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const {
    todaySchedule = [],
    upcomingSchedule = [],
    todayAppointmentsCount = 0,
    upcomingAppointmentsCount = 0,
    completedConsultationsCount = 0,
    pendingConsultationsCount = 0,
    activePatientsCount = 0,
    criticalAlertsCount = 0,
    highRiskAlerts = [],
    prescriptionsIssuedCount = 0,
    unreadNotificationsCount = 0,
    authorizedPatients = [],
    isAvailable = true,
    verificationStatus = 'pending',
    consultationFee = 500
  } = data || {};

  const filteredTodaySchedule = todaySchedule.filter(appt => {
    if (!searchTerm.trim()) return true;
    const patName = appt.patients?.full_name || '';
    const sym = appt.symptoms_summary || '';
    return patName.toLowerCase().includes(searchTerm.toLowerCase()) || sym.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        
        {/* Top Header Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: '#ccfbf1',
                color: '#0f766e',
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Stethoscope size={12} /> CLINICAL MISSION CONTROL
              </span>
              <span style={{
                background: verificationStatus === 'approved' ? '#dcfce7' : '#fef3c7',
                color: verificationStatus === 'approved' ? '#166534' : '#92400e',
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '6px'
              }}>
                {verificationStatus === 'approved' ? '● VERIFIED PRACTITIONER' : '● CREDENTIAL REVIEW PENDING'}
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Welcome, Dr. {profile?.full_name || 'Practitioner'}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Real-time patient triage, teleconsultation queue, and clinical access overview.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link
              to="/doctor/availability"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                fontWeight: '700',
                color: '#0f172a',
                textDecoration: 'none'
              }}
            >
              <Clock size={15} color="#0f766e" />
              Availability: {isAvailable ? 'Active' : 'Offline'}
            </Link>

            <Link
              to="/doctor/prescribe"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#0f766e',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)'
              }}
            >
              <FilePlus2 size={15} /> Issue Digital Rx
            </Link>
          </div>
        </div>

        {/* High-Risk AI Alerts Banner (Assistive Guardrail) */}
        {criticalAlertsCount > 0 && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#ffe4e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertTriangle size={20} color="#e11d48" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#9f1239' }}>
                    {criticalAlertsCount} High-Risk Clinical Inferences Detected
                  </strong>
                  <span style={{ background: '#ffe4e6', color: '#9f1239', fontSize: '10.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                    DOCTOR REVIEW REQUIRED
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#be123c', margin: '2px 0 0 0' }}>
                  AI preliminary risk markers synthesized from patient reported symptoms. AI does not autonomously diagnose.
                </p>
              </div>
            </div>
            <Link
              to="/doctor/ai-insights"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                background: '#e11d48',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Inspect Inferences
            </Link>
          </div>
        )}

        {/* 4 Real Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Card 1: Today's Appointments */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b' }}>TODAY'S VISITS</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={16} color="#0f766e" />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>
              {todayAppointmentsCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {pendingConsultationsCount} pending review • {completedConsultationsCount} completed
            </div>
          </div>

          {/* Card 2: Upcoming Appointments */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b' }}>UPCOMING QUEUE</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} color="#2563eb" />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>
              {upcomingAppointmentsCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Scheduled next 14 days
            </div>
          </div>

          {/* Card 3: Active Patient Relationships */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b' }}>AUTHORIZED PATIENTS</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color="#7c3aed" />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>
              {activePatientsCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Active patient_doctor_access bridges
            </div>
          </div>

          {/* Card 4: Prescriptions Issued */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#64748b' }}>PRESCRIPTIONS ISSUED</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} color="#16a34a" />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '8px' }}>
              {prescriptionsIssuedCount}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Validated on create_prescription_tx
            </div>
          </div>
        </div>

        {/* Main Work Area: Tabs & Queue */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          {/* Tab Navigation Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setFilterTab('today')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: filterTab === 'today' ? '#0f766e' : '#f1f5f9',
                  color: filterTab === 'today' ? '#ffffff' : '#475569'
                }}
              >
                Today's Schedule ({todayAppointmentsCount})
              </button>
              <button
                onClick={() => setFilterTab('upcoming')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: filterTab === 'upcoming' ? '#0f766e' : '#f1f5f9',
                  color: filterTab === 'upcoming' ? '#ffffff' : '#475569'
                }}
              >
                Upcoming Queue ({upcomingAppointmentsCount})
              </button>
              <button
                onClick={() => setFilterTab('patients')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: filterTab === 'patients' ? '#0f766e' : '#f1f5f9',
                  color: filterTab === 'patients' ? '#ffffff' : '#475569'
                }}
              >
                Authorized Patients ({activePatientsCount})
              </button>
            </div>

            {/* Quick Search in queue */}
            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Filter by patient or symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              />
            </div>
          </div>

          {/* Tab 1: Today's Appointments Table */}
          {filterTab === 'today' && (
            <div>
              {filteredTodaySchedule.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                  <Calendar size={38} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
                    No appointments scheduled for today
                  </h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    Patients booking teleconsultations will appear in this real-time queue.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                        <th style={{ padding: '12px 16px' }}>Slot Time</th>
                        <th style={{ padding: '12px 16px' }}>Patient</th>
                        <th style={{ padding: '12px 16px' }}>Consultation Type</th>
                        <th style={{ padding: '12px 16px' }}>Reported Symptoms</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTodaySchedule.map(appt => (
                        <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                            {appt.time_slot}
                            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                              {appt.appointment_number}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>
                              {appt.patients?.full_name || 'Authorized Patient'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              ABHA: {appt.patients?.abha_id || '91-XXXX-XXXX'} • BP: {appt.patients?.bp_systolic || '120'}/{appt.patients?.bp_diastolic || '80'}
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
                            {appt.symptoms_summary || 'Routine clinical assessment'}
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
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <Link
                              to={`/doctor/consultation/${appt.id}`}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#0f766e',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              Enter Room <ChevronRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Upcoming Queue Table */}
          {filterTab === 'upcoming' && (
            <div>
              {upcomingSchedule.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                  <Clock size={38} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
                    No upcoming appointments
                  </h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    Future scheduled visits will be listed here.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                        <th style={{ padding: '12px 16px' }}>Date & Slot</th>
                        <th style={{ padding: '12px 16px' }}>Patient</th>
                        <th style={{ padding: '12px 16px' }}>Type</th>
                        <th style={{ padding: '12px 16px' }}>Reported Symptoms</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingSchedule.map(appt => (
                        <tr key={appt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                            {appt.appointment_date}
                            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', fontWeight: 'normal' }}>
                              {appt.time_slot}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: '#0f172a' }}>
                              {appt.patients?.full_name || 'Patient'}
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              {appt.patients?.phone || 'No phone'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: '#eff6ff', color: '#2563eb' }}>
                              {appt.consultation_type.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#475569', maxWidth: '280px' }}>
                            {appt.symptoms_summary || 'Scheduled visit'}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: '700', background: '#fef3c7', color: '#92400e' }}>
                              {appt.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <Link
                              to={`/doctor/consultation/${appt.id}`}
                              style={{ padding: '5px 10px', borderRadius: '6px', background: '#f1f5f9', color: '#334155', fontSize: '12px', fontWeight: '600', textDecoration: 'none' }}
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Authorized Patients */}
          {filterTab === 'patients' && (
            <div>
              {authorizedPatients.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                  <Users size={38} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
                    No active clinical access bridges
                  </h3>
                  <p style={{ fontSize: '13px', margin: 0 }}>
                    When patients schedule consultations, an authorized relationship is established in patient_doctor_access.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '12px' }}>
                        <th style={{ padding: '12px 16px' }}>Patient Name</th>
                        <th style={{ padding: '12px 16px' }}>ABHA Address</th>
                        <th style={{ padding: '12px 16px' }}>Baseline Vitals</th>
                        <th style={{ padding: '12px 16px' }}>Access Expires</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>EHR Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {authorizedPatients.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                            {p.name}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b' }}>
                            {p.abha}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '12px', color: '#334155' }}>
                              BP: {p.vitals?.bp_systolic || '120'}/{p.vitals?.bp_diastolic || '80'} • Sugar: {p.vitals?.blood_sugar || '100'} mg/dL
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                            {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : 'Active (14d)'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <Link
                              to={`/doctor/records?patientId=${p.id}`}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#0f766e',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <Eye size={12} /> View EHR Vault
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Links & Safety Footer */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#0f766e" /> ABDM Clinical Compliance
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              All digital prescriptions and diagnostic encounters are cryptographically verified and bound to patient Consent Tokens.
            </p>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} color="#2563eb" /> Practice Analytics
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 8px 0', lineHeight: 1.5 }}>
              Track consultation completion rates, volume breakdown, and prescription history.
            </p>
            <Link to="/doctor/analytics" style={{ fontSize: '12.5px', fontWeight: '700', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Open Practice Analytics <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
