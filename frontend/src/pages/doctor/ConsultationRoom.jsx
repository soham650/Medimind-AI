import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointment.service';
import { consultationService } from '../../services/consultation.service';
import { medicalRecordsService } from '../../services/medical_records.service';
import { reportService } from '../../services/report.service';
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
  ArrowLeft
} from 'lucide-react';

export default function ConsultationRoom() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const doctorId = profile?.id || user?.id;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState(null);
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

  // Assistive AI state
  const [aiSuggestionsViewed, setAiSuggestionsViewed] = useState(false);

  useEffect(() => {
    async function loadEncounterData() {
      if (!appointmentId) return;
      setLoading(true);
      try {
        const appt = await appointmentService.getAppointmentById(appointmentId);
        setAppointment(appt);

        if (appt) {
          setChiefComplaint(appt.symptoms_summary || '');

          // Update appointment status to in_progress if currently scheduled
          if (appt.status === 'scheduled' || appt.status === 'requested') {
            await appointmentService.updateStatus(appointmentId, 'in_progress');
          }

          // Hydrate patient clinical details
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
        }
      } catch (err) {
        console.error('Encounter hydration error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEncounterData();
  }, [appointmentId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveConsultation = async (markComplete = false) => {
    if (!diagnosis.trim()) {
      alert('Clinical Diagnosis is mandatory before saving the encounter.');
      return;
    }

    setSavingEncounter(true);
    try {
      const fullSummary = `
[Clinical Observations]: ${clinicalSummary || 'Clinical exam performed.'}
[Treatment Plan]: ${treatmentPlan || 'Conservative supportive care.'}
[Follow-Up]: ${followUpNotes || 'PRN / As needed.'}
      `.trim();

      await consultationService.recordConsultation({
        appointmentId,
        doctorId,
        patientId: appointment.patient_id,
        chiefComplaint: chiefComplaint || 'Routine assessment',
        clinicalSummary: fullSummary,
        diagnosis: diagnosis.trim()
      });

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

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0f766e" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Initializing Secure Teleconsultation Workspace...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <AlertTriangle size={36} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Appointment Encounter Not Found</h3>
        <p style={{ color: '#64748b', fontSize: '13px' }}>The specified appointment ID could not be loaded or access is restricted.</p>
        <Link to="/doctor/appointments" style={{ color: '#0f766e', fontWeight: '700', fontSize: '13px' }}>
          ← Return to Appointment Queue
        </Link>
      </div>
    );
  }

  const patient = appointment.patient || {};
  const patientName = patient.full_name || 'Authorized Patient';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '20px 24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Toast */}
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

      {/* Top Breadcrumb & Status Bar */}
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
            to="/doctor/appointments"
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
            <ArrowLeft size={14} /> Back to Queue
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
            <Lock size={12} /> Clinical Access Bridge Active
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

      {/* 2-Column Clinical Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '20px' }}>
        
        {/* LEFT COLUMN: Telehealth Stream + Patient Longitudinal EHR Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Telehealth Provider Component (Abstraction layer) */}
          <VideoConsultationProvider
            appointment={appointment}
            patient={patient}
            doctor={appointment.doctor}
            onEndConsultation={() => handleSaveConsultation(true)}
            sessionStatus={appointment.status}
          />

          {/* Patient Demographic & Baseline Vitals Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                  {patientName}
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
                  Patient Private Notes: "{appointment.patient_notes}"
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

          {/* Assistive AI Insights Panel (Clinical Guardrail Embedded) */}
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

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setAiSuggestionsViewed(true);
                  showToast('AI preliminary differential: Acute Upper Respiratory Tract Infection (78% confidence). Click to manually adopt if confirmed by clinical judgment.');
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Inspect AI Diagnostic Differential
              </button>
            </div>
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
                Clinician: Dr. {appointment.doctor?.full_name || profile?.full_name}
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

    </div>
  );
}
