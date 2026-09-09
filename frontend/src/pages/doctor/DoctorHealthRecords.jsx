import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctor.service';
import { medicalRecordsService } from '../../services/medical_records.service';
import { reportService } from '../../services/report.service';
import { supabase } from '../../lib/supabaseClient';
import { 
  FolderOpen, 
  FileText, 
  Activity, 
  User, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  Search, 
  Plus, 
  Calendar,
  CheckCircle2,
  Share2,
  Eye
} from 'lucide-react';

export default function DoctorHealthRecords() {
  const { user, profile } = useAuth();
  const doctorId = profile?.id || user?.id;

  const [searchParams] = useSearchParams();
  const { patientId: routePatientId } = useParams();
  const requestedPatientId = routePatientId || searchParams.get('patientId');

  const [authorizedPatients, setAuthorizedPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(requestedPatientId || '');
  const [patientData, setPatientData] = useState(null);
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [hasAccess, setHasAccess] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'reports' | 'assessments'
  const [newNoteModal, setNewNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load authorized patients for this doctor
  useEffect(() => {
    async function loadDoctorPatients() {
      if (!doctorId) return;
      try {
        const mc = await doctorService.getMissionControlData(doctorId);
        if (mc?.authorizedPatients && mc.authorizedPatients.length > 0) {
          setAuthorizedPatients(mc.authorizedPatients);
          if (!selectedPatientId) {
            setSelectedPatientId(mc.authorizedPatients[0].id);
          }
        }
      } catch (err) {
        console.warn('Authorized patients fetch notice:', err);
      }
    }
    loadDoctorPatients();
  }, [doctorId]);

  // Load selected patient's longitudinal EHR
  useEffect(() => {
    async function loadPatientEHR() {
      if (!selectedPatientId || !doctorId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasAccess(true);

      try {
        // 1. Fetch patient profile (will return 0 rows if RLS blocks due to lack of access)
        const { data: pat, error: patErr } = await supabase
          .from('patients')
          .select('*')
          .eq('id', selectedPatientId)
          .single();

        if (patErr || !pat) {
          setHasAccess(false);
          setPatientData(null);
          setLoading(false);
          return;
        }

        setPatientData(pat);

        // 2. Hydrate records, reports, symptom assessments, and allergies in parallel
        const [recs, reps, assess, algs] = await Promise.all([
          medicalRecordsService.getRecords(selectedPatientId).catch(() => []),
          reportService.getReports(selectedPatientId).catch(() => []),
          supabase
            .from('symptom_assessments')
            .select('*')
            .eq('patient_id', selectedPatientId)
            .order('created_at', { ascending: false })
            .then(res => res.data || []),
          medicalRecordsService.getAllergies(selectedPatientId).catch(() => [])
        ]);

        setRecords(recs || []);
        setReports(reps || []);
        setAssessments(assess || []);
        setAllergies(algs || []);
      } catch (err) {
        console.error('Error loading patient EHR:', err);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    loadPatientEHR();
  }, [selectedPatientId, doctorId]);

  const handleAddClinicalNote = async (e) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      alert('Please fill in both Title and Clinical Note content.');
      return;
    }

    setSavingNote(true);
    try {
      await medicalRecordsService.addRecord({
        patientId: selectedPatientId,
        doctorId,
        recordType: 'clinical_note',
        title: newNoteTitle.trim(),
        clinicalSummary: newNoteContent.trim(),
        structuredData: { author: profile?.full_name || 'Attending Physician' }
      });

      showToast('✓ Clinical note added to patient longitudinal EHR vault.');
      setNewNoteModal(false);
      setNewNoteTitle('');
      setNewNoteContent('');

      // Reload records
      const updatedRecs = await medicalRecordsService.getRecords(selectedPatientId);
      setRecords(updatedRecs || []);
    } catch (err) {
      alert('Failed to save record: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
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

        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ccfbf1', color: '#0f766e', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', marginBottom: '6px' }}>
              <FolderOpen size={13} /> UNIFIED EHR & LONGITUDINAL VAULT
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Patient Clinical History & Health Records
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Inspect authorized patient health records, diagnostic lab reports, and past consultations.
            </p>
          </div>

          {/* Patient Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Select Patient:</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                background: '#ffffff',
                fontWeight: '600',
                color: '#0f172a',
                minWidth: '220px'
              }}
            >
              {authorizedPatients.length === 0 ? (
                <option value="">No authorized patients</option>
              ) : (
                authorizedPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.abha || '91-XXXX'})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Access Restriction Check */}
        {!hasAccess ? (
          <div style={{ background: '#ffffff', border: '1px solid #fecaca', borderRadius: '12px', padding: '48px 24px', textAlign: 'center' }}>
            <AlertTriangle size={42} color="#dc2626" style={{ margin: '0 auto 12px auto' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#991b1b', margin: '0 0 8px 0' }}>
              Clinical Access Restricted (RLS Enforced)
            </h2>
            <p style={{ fontSize: '13px', color: '#7f1d1d', maxWidth: '520px', margin: '0 auto 16px auto', lineHeight: 1.5 }}>
              You do not currently have an active clinical relationship in <code>patient_doctor_access</code> with this patient, or the access period has expired.
              Under HIPAA and ABDM health data governance, patient health records are strictly isolated.
            </p>
            <Link
              to="/doctor/appointments"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#0f766e',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Return to Appointment Queue
            </Link>
          </div>
        ) : loading ? (
          <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw className="animate-spin" size={32} color="#0f766e" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ fontSize: '13px', margin: 0 }}>Decentralizing and decrypting authorized EHR bundle...</p>
          </div>
        ) : !patientData ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <User size={38} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>No patient selected</h3>
            <p style={{ fontSize: '13px', margin: '4px 0 0 0' }}>Select an authorized patient from the dropdown above.</p>
          </div>
        ) : (
          <div>
            {/* Patient Header Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '20px 24px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: '#ccfbf1',
                  color: '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '800'
                }}>
                  {(patientData.full_name || 'PT').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      {patientData.full_name}
                    </h2>
                    <span style={{ fontSize: '11px', fontWeight: '800', background: '#ccfbf1', color: '#0f766e', padding: '2px 8px', borderRadius: '4px' }}>
                      ACCESS GRANTED VIA CLINICAL RELATIONSHIP
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                    ABHA: <strong>{patientData.abha_id || '91-XXXX-XXXX'}</strong> • Blood Group: <strong>{patientData.blood_group || 'N/A'}</strong> • Phone: {patientData.phone || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setNewNoteModal(true)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#0f766e',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Add Clinical Progress Note
                </button>
              </div>
            </div>

            {/* Baseline Vitals Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block' }}>BLOOD PRESSURE</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                  {patientData.bp_systolic || '120'}/{patientData.bp_diastolic || '80'} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>mmHg</span>
                </strong>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block' }}>FASTING BLOOD SUGAR</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                  {patientData.blood_sugar || '95'} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>mg/dL</span>
                </strong>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block' }}>BMI INDEX</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                  {patientData.bmi || '23.1'} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#16a34a' }}>Healthy</span>
                </strong>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block' }}>RECORDED ALLERGIES</span>
                <strong style={{ fontSize: '13px', color: allergies.length > 0 ? '#dc2626' : '#16a34a' }}>
                  {allergies.length > 0 ? `${allergies.length} Active Allergies` : 'No known allergies'}
                </strong>
              </div>
            </div>

            {/* Longitudinal Records Tabs */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '8px 16px', gap: '8px' }}>
                <button
                  onClick={() => setActiveTab('records')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: activeTab === 'records' ? '#0f766e' : 'transparent',
                    color: activeTab === 'records' ? '#ffffff' : '#475569'
                  }}
                >
                  Clinical Notes & Diagnoses ({records.length})
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: activeTab === 'reports' ? '#0f766e' : 'transparent',
                    color: activeTab === 'reports' ? '#ffffff' : '#475569'
                  }}
                >
                  Diagnostic Reports & Lab Slips ({reports.length})
                </button>
                <button
                  onClick={() => setActiveTab('assessments')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: activeTab === 'assessments' ? '#0f766e' : 'transparent',
                    color: activeTab === 'assessments' ? '#ffffff' : '#475569'
                  }}
                >
                  AI Symptom Telemetry ({assessments.length})
                </button>
              </div>

              {/* Tab 1: Clinical Records */}
              {activeTab === 'records' && (
                <div style={{ padding: '20px' }}>
                  {records.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <FileText size={36} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ margin: 0, fontSize: '13px' }}>No clinical notes documented yet for this patient.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {records.map(rec => (
                        <div key={rec.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{rec.title}</strong>
                              <span style={{ fontSize: '11px', fontWeight: '700', background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                                {rec.record_type}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {rec.record_date || new Date(rec.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                            {rec.clinical_summary}
                          </p>
                          {rec.doctor && (
                            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '8px' }}>
                              Author: Dr. {rec.doctor.full_name} ({rec.doctor.specialization || 'Clinical Practitioner'})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Diagnostic Reports */}
              {activeTab === 'reports' && (
                <div style={{ padding: '20px' }}>
                  {reports.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <FileText size={36} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ margin: 0, fontSize: '13px' }}>No diagnostic reports uploaded for this patient.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {reports.map(rep => (
                        <div key={rep.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>{rep.report_title}</strong>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Type: {rep.report_type || 'Clinical Report'} • Uploaded: {new Date(rep.created_at).toLocaleDateString()} • Status: {rep.processing_status || 'completed'}
                            </span>
                          </div>
                          {rep.storage_path && (
                            <span style={{ fontSize: '11.5px', color: '#0f766e', fontWeight: '700' }}>
                              Vault Path: {rep.storage_path}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: AI Assessments */}
              {activeTab === 'assessments' && (
                <div style={{ padding: '20px' }}>
                  {assessments.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                      <Activity size={36} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                      <p style={{ margin: 0, fontSize: '13px' }}>No symptom assessments recorded for this patient.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {assessments.map(a => (
                        <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '800',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: a.risk_level === 'High' ? '#fee2e2' : (a.risk_level === 'Moderate' ? '#fef3c7' : '#dcfce7'),
                              color: a.risk_level === 'High' ? '#991b1b' : (a.risk_level === 'Moderate' ? '#92400e' : '#166534')
                            }}>
                              RISK: {a.risk_level}
                            </span>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              {new Date(a.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>
                            <strong>Reported Symptoms:</strong> {(a.symptoms || []).join(', ')}
                          </div>

                          {a.possible_conditions && a.possible_conditions.length > 0 && (
                            <div style={{ fontSize: '12.5px', color: '#475569' }}>
                              <strong>AI Differential:</strong> {a.possible_conditions.map(c => `${c.condition} (${Math.round(c.probability * 100)}%)`).join(', ')}
                            </div>
                          )}

                          <div style={{ fontSize: '11px', color: '#7c3aed', background: '#faf5ff', padding: '6px 10px', borderRadius: '4px', marginTop: '10px' }}>
                            ℹ Assistive AI telemetry only. Doctor verification required before making diagnostic conclusions.
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {newNoteModal && (
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
              maxWidth: '520px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
                Add Clinical Progress Note
              </h3>

              <form onSubmit={handleAddClinicalNote}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                    Note Title *
                  </label>
                  <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="e.g. Hypertension Follow-Up Progress Note"
                    required
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

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                    Clinical Findings & Plan *
                  </label>
                  <textarea
                    rows="5"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Document clinical observations, medication titration, patient response, and follow-up instructions..."
                    required
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewNoteModal(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingNote}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '6px',
                      background: '#0f766e',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#ffffff',
                      cursor: savingNote ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {savingNote ? 'Saving...' : 'Save to EHR'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
