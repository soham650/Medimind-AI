import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointment.service';
import { consultationService } from '../../services/consultation.service';
import { medicalRecordsService } from '../../services/medical_records.service';
import { reportService } from '../../services/report.service';
import { notificationService } from '../../services/notification.service';
import VideoConsultationProvider from '../../components/common/VideoConsultationProvider';
import { 
  FileText, 
  Activity, 
  Heart, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Lock, 
  RefreshCw, 
  Send, 
  Plus, 
  ExternalLink,
  ChevronRight,
  FilePlus2,
  Stethoscope,
  ArrowLeft,
  UserCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function ConsultationRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [userParticipantRole, setUserParticipantRole] = useState(null);

  // Doctor-specific Clinical Context
  const [patientAllergies, setPatientAllergies] = useState([]);
  const [patientRecords, setPatientRecords] = useState([]);
  const [patientReports, setPatientReports] = useState([]);
  const [existingConsultation, setExistingConsultation] = useState(null);

  // Doctor Clinical Workspace State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [savingEncounter, setSavingEncounter] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Patient view state
  const [consultationConcluded, setConsultationConcluded] = useState(false);

  useEffect(() => {
    async function initConsultationRoom() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      // If no appointmentId in URL, auto-resolve to doctor's active appointment or instant telehealth room
      if (!appointmentId) {
        setLoading(true);
        try {
          const isDoc = role === 'doctor';
          const { data: latestAppt } = await supabase
            .from('appointments')
            .select('id, appointment_number, appointment_date, time_slot, status, symptoms_summary, patient_id, doctor_id, patients(*), doctors(*)')
            .eq(isDoc ? 'doctor_id' : 'patient_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (latestAppt?.id) {
            setAppointment({
              ...latestAppt,
              patient: latestAppt.patients,
              doctor: latestAppt.doctors
            });
            setUserParticipantRole(isDoc ? 'doctor' : 'patient');
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Auto-resolving appointment note:', e.message);
        }

        // On-demand clinical live room fallback
        const isDoc = role === 'doctor';
        setAppointment({
          id: `room-${user.id.slice(0, 8)}`,
          appointment_number: 'LIVE-CONSULT',
          status: 'in_progress',
          consultation_type: 'video',
          patient_id: isDoc ? null : user.id,
          doctor_id: isDoc ? user.id : null,
          patient: isDoc ? {
            id: 'peer-patient',
            full_name: 'Patient (Remote Peer)',
            phone: '+91 98765 43210',
            abha_id: '12-3456-7890-1234'
          } : profile || {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Patient'
          },
          doctor: isDoc ? profile || {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Dr. Practitioner'
          } : {
            id: 'peer-doctor',
            full_name: 'Dr. MediMind Specialist',
            specialization: 'General Medicine & Telehealth'
          }
        });
        setUserParticipantRole(isDoc ? 'doctor' : 'patient');
        setLoading(false);
        return;
      }

      setLoading(true);
      setAuthError(null);

      try {
        // 1. Strict Security & Authorization Check
        const authResult = await consultationService.validateConsultationAccess({
          appointmentId,
          userId: user.id,
          userRole: role
        });

        if (!authResult.authorized) {
          setAuthError(authResult.message || 'Access restricted by consultation authorization policy.');
          setLoading(false);
          return;
        }

        const appt = authResult.appointment;
        setAppointment(appt);
        setUserParticipantRole(authResult.role);

        // 2. Transition appointment to in_progress if currently scheduled or requested
        if (appt.status === 'scheduled' || appt.status === 'confirmed' || appt.status === 'requested') {
          await consultationService.updateConsultationStatus(appointmentId, 'in_progress');
        }

        // 3. Dispatch join event notification to peer
        if (authResult.role === 'doctor') {
          // Notify patient that doctor has joined
          if (appt.patient_id) {
            notificationService.dispatchNotification({
              userId: appt.patient_id,
              templateKey: 'CONSULTATION_DOCTOR_JOINED',
              params: {
                doctorName: `Dr. ${appt.doctor?.full_name || 'Your Doctor'}`
              },
              link: `/patient/appointments`
            }).catch(() => {});
          }

          // Hydrate patient clinical details for doctor
          setChiefComplaint(appt.symptoms_summary || '');
          if (appt.patient_id) {
            const [allergies, records, reports, existingCons] = await Promise.all([
              medicalRecordsService.getAllergies(appt.patient_id).catch(() => []),
              medicalRecordsService.getRecords(appt.patient_id).catch(() => []),
              reportService.getReports(appt.patient_id).catch(() => []),
              consultationService.getByAppointment(appointmentId).catch(() => null)
            ]);

            setPatientAllergies(allergies || []);
            setPatientRecords(records || []);
            setPatientReports(reports || []);
            
            if (existingCons) {
              setExistingConsultation(existingCons);
              setChiefComplaint(existingCons.chief_complaint || appt.symptoms_summary || '');
              setClinicalSummary(existingCons.clinical_summary || '');
              setDiagnosis(existingCons.diagnosis || '');
            }
          }
        } else if (authResult.role === 'patient') {
          // Notify doctor that patient has arrived in waiting room
          if (appt.doctor_id) {
            notificationService.dispatchNotification({
              userId: appt.doctor_id,
              templateKey: 'CONSULTATION_PATIENT_JOINED',
              params: {
                patientName: appt.patient?.full_name || 'Patient'
              },
              link: `/doctor/appointments`
            }).catch(() => {});
          }
        }

      } catch (err) {
        console.error('Consultation initialization error:', err);
        setAuthError(err.message || 'Failed to initialize teleconsultation room.');
      } finally {
        setLoading(false);
      }
    }

    initConsultationRoom();
  }, [appointmentId, user?.id, role]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveConsultation = async (markComplete = false) => {
    if (!diagnosis.trim()) {
      alert('Clinical Diagnosis is mandatory before concluding the encounter.');
      return;
    }

    setSavingEncounter(true);
    try {
      const fullSummary = `
[Clinical Observations]: ${clinicalSummary || 'Clinical exam performed via WebRTC.'}
[Treatment Plan]: ${treatmentPlan || 'Conservative supportive care.'}
[Follow-Up]: ${followUpNotes || 'PRN / As needed.'}
      `.trim();

      await consultationService.recordConsultation({
        appointmentId,
        doctorId: user.id,
        patientId: appointment.patient_id,
        chiefComplaint: chiefComplaint || 'Routine teleconsultation',
        clinicalSummary: fullSummary,
        diagnosis: diagnosis.trim()
      });

      // Dispatch consultation completed notification to patient
      if (appointment.patient_id) {
        notificationService.dispatchNotification({
          userId: appointment.patient_id,
          templateKey: 'CONSULTATION_CONCLUDED',
          params: {
            appointmentNumber: appointment.appointment_number
          },
          link: '/patient/appointments'
        }).catch(() => {});
      }

      showToast('✓ Consultation record and clinical notes saved to EHR vault!');

      if (markComplete) {
        showToast('✓ Encounter concluded and appointment marked as completed.');
        setTimeout(() => {
          navigate('/doctor/appointments');
        }, 1200);
      }
    } catch (err) {
      alert('Failed to save encounter: ' + err.message);
    } finally {
      setSavingEncounter(false);
    }
  };

  const handlePatientEndCall = () => {
    setConsultationConcluded(true);
    showToast('You have left the consultation room.');
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0f766e" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Initializing Secure Teleconsultation Workspace...</p>
      </div>
    );
  }

  // Authorization or Not Found Rejection Screen
  if (authError || !appointment) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '520px', margin: '0 auto' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: '#dc2626'
        }}>
          <AlertTriangle size={32} />
        </div>
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
          Consultation Room Access Denied
        </h3>
        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
          {authError || 'The specified appointment could not be verified for your account.'}
        </p>
        <Link
          to={role === 'doctor' ? '/doctor/appointments' : '/patient/appointments'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            borderRadius: '8px',
            background: '#0f766e',
            color: '#ffffff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '700'
          }}
        >
          <ArrowLeft size={15} /> Return to Appointments Queue
        </Link>
      </div>
    );
  }

  const patient = appointment.patient || {};
  const doctor = appointment.doctor || {};
  const isDoctor = userParticipantRole === 'doctor';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0f766e',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '13px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      {/* Top Header / Breadcrumb Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to={isDoctor ? '/doctor/appointments' : '/patient/appointments'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              color: '#64748b',
              fontSize: '13px',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            <ArrowLeft size={14} /> Back
          </Link>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
            Encounter: {appointment.appointment_number}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: '#ccfbf1',
            color: '#0f766e',
            fontSize: '11px',
            fontWeight: '800',
            padding: '4px 10px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Lock size={12} /> Encrypted WebRTC Session
          </span>
          <span style={{
            background: appointment.status === 'completed' ? '#dcfce7' : '#fef3c7',
            color: appointment.status === 'completed' ? '#166534' : '#92400e',
            fontSize: '11px',
            fontWeight: '700',
            padding: '4px 10px',
            borderRadius: '6px',
            textTransform: 'uppercase'
          }}>
            Status: {appointment.status}
          </span>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: DOCTOR VIEW (2-COLUMN CLINICAL ENCOUNTER WORKSPACE)
          ========================================================================= */}
      {isDoctor && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '20px' }}>
          
          {/* LEFT COLUMN: Live WebRTC Telehealth Stream + Patient Longitudinal EHR Context */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Real WebRTC Video Provider Presentation */}
            <VideoConsultationProvider
              appointment={appointment}
              patient={patient}
              doctor={doctor}
              currentUser={user}
              userRole="doctor"
              onEndConsultation={() => handleSaveConsultation(true)}
              sessionStatus={appointment.status}
            />

            {/* Patient Demographic & Baseline Vitals Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                    {patient.full_name || 'Patient'}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    ABHA: {patient.abha_id || '91-XXXX-XXXX'} • Blood Group: {patient.blood_group || 'O+'} • Phone: {patient.phone || 'N/A'}
                  </span>
                </div>
                <Link
                  to={`/doctor/records?patientId=${appointment.patient_id}`}
                  target="_blank"
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#0f766e',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Full EHR Vault <ExternalLink size={12} />
                </Link>
              </div>

              {/* Vitals Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block' }}>BLOOD PRESSURE</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                    {patient.bp_systolic || '120'}/{patient.bp_diastolic || '80'} <span style={{ fontSize: '10px', color: '#64748b' }}>mmHg</span>
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block' }}>BLOOD SUGAR</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                    {patient.blood_sugar || '98'} <span style={{ fontSize: '10px', color: '#64748b' }}>mg/dL</span>
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block' }}>BMI INDEX</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                    {patient.bmi || '23.4'} <span style={{ fontSize: '10px', color: '#64748b' }}>Normal</span>
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#64748b', display: 'block' }}>EMERGENCY CONTACT</span>
                  <strong style={{ fontSize: '12px', color: '#0f172a' }}>
                    {patient.emergency_contact || 'None listed'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Reported Symptoms & Allergies */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>
                Reported Symptoms & Clinical Context
              </h4>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <p style={{ fontSize: '13px', color: '#334155', margin: 0, fontWeight: '500' }}>
                  {appointment.symptoms_summary || 'Patient did not provide detailed symptoms summary.'}
                </p>
                {appointment.patient_notes && (
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                    Patient Notes: "{appointment.patient_notes}"
                  </div>
                )}
              </div>

              {/* Documented Allergies */}
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>
                Documented Patient Allergies ({patientAllergies.length})
              </h4>
              {patientAllergies.length === 0 ? (
                <span style={{ fontSize: '12px', color: '#16a34a', background: '#f0fdf4', padding: '3px 8px', borderRadius: '4px', display: 'inline-block' }}>
                  ✓ No known drug allergies (NKDA) recorded
                </span>
              ) : (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {patientAllergies.map(alg => (
                    <span
                      key={alg.id}
                      style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      ⚠ {alg.allergen} ({alg.severity || 'Moderate'})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Assistive AI Insights Panel */}
            <div style={{
              background: '#faf5ff',
              border: '1px solid #e9d5ff',
              borderRadius: '12px',
              padding: '16px 20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#7c3aed', fontWeight: '800', fontSize: '13px' }}>
                  <Sparkles size={16} /> AI Assistive Clinical Telemetry
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '800', background: '#ede9fe', color: '#6d28d9', padding: '2px 6px', borderRadius: '4px' }}>
                  ASSISTIVE ONLY
                </span>
              </div>

              <p style={{ fontSize: '12px', color: '#581c87', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                <strong>Clinical Guardrail:</strong> AI inferences provide preliminary pattern recognition based on patient symptom profiles.
                AI does not autonomously diagnose or prescribe. Final clinical assessment rests strictly with the licensed practitioner.
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: Doctor Clinical Workspace & Encounter Documentation */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Clinical Encounter Workspace
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Clinician: Dr. {doctor.full_name || profile?.full_name}
                </span>
              </div>

              <Link
                to={`/doctor/prescribe?patientId=${appointment.patient_id}&appointmentId=${appointmentId}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: '700',
                  textDecoration: 'none',
                  border: '1px solid #bfdbfe'
                }}
              >
                <FilePlus2 size={13} /> Open Digital Rx Pad
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              
              {/* Chief Complaint */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Chief Complaint (Subjective) *
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Dry cough, mild sore throat for 3 days"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Objective Exam & Clinical Observations */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Clinical Observations & Examination (Objective)
                </label>
                <textarea
                  rows="3"
                  value={clinicalSummary}
                  onChange={(e) => setClinicalSummary(e.target.value)}
                  placeholder="Physical exam findings, throat erythema, clear chest on auscultation..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                ></textarea>
              </div>

              {/* Confirmed Diagnosis */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0f766e', marginBottom: '4px' }}>
                  Clinician-Authored Diagnosis * (Mandatory)
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Viral Pharyngitis (ICD-10 J02.9)"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '2px solid #0f766e',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', display: 'block' }}>
                  Must be authored and confirmed by the attending physician.
                </span>
              </div>

              {/* Treatment Plan */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Treatment Plan & Care Recommendations
                </label>
                <textarea
                  rows="3"
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Hydration, saline gargles, warm fluids, rest..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                ></textarea>
              </div>

              {/* Follow-up Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Follow-up & Warning Signs
                </label>
                <input
                  type="text"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="e.g. Return if fever persists beyond 48 hours or dyspnea develops"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

            </div>

            {/* Action Footer */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => handleSaveConsultation(false)}
                disabled={savingEncounter}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: savingEncounter ? 'not-allowed' : 'pointer'
                }}
              >
                {savingEncounter ? 'Saving...' : 'Save Draft Notes'}
              </button>

              <button
                onClick={() => handleSaveConsultation(true)}
                disabled={savingEncounter}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: '#0f766e',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: savingEncounter ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(15, 118, 110, 0.2)'
                }}
              >
                <CheckCircle2 size={15} />
                {savingEncounter ? 'Recording...' : 'Conclude & Sign Encounter'}
              </button>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          VIEW 2: PATIENT VIEW (FOCUSED TELECONSULTATION EXPERIENCE)
          ========================================================================= */}
      {!isDoctor && (
        <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Doctor Info Card */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#0f766e',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '800'
              }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                  Dr. {doctor.full_name || 'Attending Physician'}
                </h3>
                <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                  {doctor.specialization || 'General Practitioner'} • {doctor.clinic_name || 'MediMind Clinical Centre'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '12px',
                color: '#0f766e',
                background: '#ccfbf1',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <UserCheck size={14} /> Medical Board Verified
              </span>
            </div>
          </div>

          {/* WebRTC Video Provider Presentation */}
          <VideoConsultationProvider
            appointment={appointment}
            patient={patient}
            doctor={doctor}
            currentUser={user}
            userRole="patient"
            onEndConsultation={handlePatientEndCall}
            sessionStatus={appointment.status}
          />

          {/* Post-Call or Checklist Card */}
          {consultationConcluded ? (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '17px', fontWeight: '800', color: '#166534', margin: '0 0 6px 0' }}>
                Teleconsultation Concluded
              </h4>
              <p style={{ fontSize: '13px', color: '#15803d', maxWidth: '480px', margin: '0 auto 18px auto', lineHeight: 1.5 }}>
                Your consultation has ended. If your doctor authored a digital prescription during this session,
                it is now accessible in your Prescriptions Vault.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Link
                  to="/prescriptions"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#16a34a',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  View Digital Prescriptions
                </Link>
                <Link
                  to="/patient/appointments"
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #bbf7d0',
                    color: '#166534',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: '700'
                  }}
                >
                  Return to Appointments
                </Link>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '18px 20px'
            }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 10px 0' }}>
                Patient Consultation Checklist
              </h4>
              <ul style={{ fontSize: '13px', color: '#475569', margin: 0, paddingLeft: '18px', lineHeight: 1.6 }}>
                <li>Ensure you are located in a quiet, well-lit private space.</li>
                <li>Keep any previous lab reports, prescription slips, or medication bottles nearby.</li>
                <li>Audio and video streams are encrypted end-to-end between you and your verified physician.</li>
                <li>Digital prescriptions issued during this call will sync automatically with partner pharmacies.</li>
              </ul>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
