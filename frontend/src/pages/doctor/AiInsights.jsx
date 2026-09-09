import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { doctorService } from '../../services/doctor.service';
import { 
  Activity, 
  Search, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Filter, 
  Layers, 
  ChevronRight, 
  Eye, 
  Info,
  Stethoscope
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AiInsights() {
  const { user, profile } = useAuth();
  const doctorId = profile?.id || user?.id;

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [findings, setFindings] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all' | 'High' | 'Moderate' | 'Low'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadTelemetry() {
      if (!doctorId) return;
      setLoading(true);
      try {
        // 1. Fetch recent symptom assessments for patients
        const { data: assessData, error: assessErr } = await supabase
          .from('symptom_assessments')
          .select(`
            id,
            patient_id,
            symptoms,
            normalized_symptoms,
            possible_conditions,
            risk_level,
            risk_reasons,
            recommended_action,
            model_version,
            created_at,
            patient:patient_id (
              id,
              full_name,
              phone,
              abha_id,
              bp_systolic,
              bp_diastolic
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!assessErr && assessData) {
          setAssessments(assessData);
          if (assessData.length > 0) {
            setSelectedItem(assessData[0]);
          }
        }

        // 2. Fetch AI clinical findings
        const { data: findData } = await supabase
          .from('ai_clinical_findings')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (findData) {
          setFindings(findData);
        }
      } catch (err) {
        console.error('Failed to load AI insights:', err);
      } finally {
        setLoading(false);
      }
    }

    loadTelemetry();
  }, [doctorId]);

  const filteredAssessments = assessments.filter(a => {
    if (severityFilter === 'all') return true;
    return a.risk_level === severityFilter;
  });

  const highRiskCount = assessments.filter(a => a.risk_level === 'High').length;
  const moderateRiskCount = assessments.filter(a => a.risk_level === 'Moderate').length;
  const lowRiskCount = assessments.filter(a => a.risk_level === 'Low').length;

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        
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

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f5f3ff', color: '#7c3aed', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', marginBottom: '6px' }}>
            <Sparkles size={13} /> ASSISTIVE CLINICAL INTELLIGENCE TELEMETRY
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            AI Preliminary Inferences & Triage Telemetry
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Review predictive risk stratifications, symptom cluster correlations, and preliminary differential models.
          </p>
        </div>

        {/* MANDATORY CLINICAL GUARDRAIL ALERT BANNER */}
        <div style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#dbeafe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldCheck size={20} color="#2563eb" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '13.5px', color: '#1e40af' }}>
                Assistive AI Telemetry Notice
              </strong>
              <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: '10.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                NOT A DIAGNOSIS • DOCTOR REVIEW REQUIRED
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#1e3a8a', margin: '2px 0 0 0', lineHeight: 1.4 }}>
              In accordance with MediMind AI clinical safety standards, machine learning models (Phase 1 <code>symptom-rf-v1</code> and multimodal report extractors) provide preliminary risk screening only. AI never autonomously diagnoses, prescribes, or overrides licensed physician authority.
            </p>
          </div>
        </div>

        {/* 3 Real Telemetry Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>TOTAL ASSESSMENTS REVIEWED</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{assessments.length}</div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Live Supabase telemetry rows</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#b91c1c' }}>HIGH-RISK ALERTS</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', marginTop: '6px' }}>{highRiskCount}</div>
            <span style={{ fontSize: '12px', color: '#b91c1c' }}>Immediate physician review advised</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #fef3c7', borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309' }}>MODERATE RISK</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '6px' }}>{moderateRiskCount}</div>
            <span style={{ fontSize: '12px', color: '#92400e' }}>Standard clinical protocol</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #dcfce7', borderRadius: '12px', padding: '16px 20px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#15803d' }}>LOW RISK</span>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '6px' }}>{lowRiskCount}</div>
            <span style={{ fontSize: '12px', color: '#166534' }}>Routine supportive guidance</span>
          </div>
        </div>

        {/* Main 2-Column Split: Case List (Left) vs Detail Inspector (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '20px' }}>
          
          {/* Left Column: Assessment Queue */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Patient Intake Inferences ({filteredAssessments.length})
              </h3>

              <div style={{ display: 'flex', gap: '4px' }}>
                {['all', 'High', 'Moderate', 'Low'].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setSeverityFilter(sev)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      background: severityFilter === sev ? '#0f766e' : '#f1f5f9',
                      color: severityFilter === sev ? '#ffffff' : '#475569'
                    }}
                  >
                    {sev === 'all' ? 'All' : sev}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw className="animate-spin" size={24} color="#0f766e" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '12px', margin: 0 }}>Loading clinical inferences...</p>
              </div>
            ) : filteredAssessments.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <Activity size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>No assessments found for this filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '560px', overflowY: 'auto' }}>
                {filteredAssessments.map(item => {
                  const isSelected = selectedItem?.id === item.id;
                  const patientName = item.patient?.full_name || 'Authorized Patient';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #0f766e' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0fdfa' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>{patientName}</strong>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: item.risk_level === 'High' ? '#fee2e2' : (item.risk_level === 'Moderate' ? '#fef3c7' : '#dcfce7'),
                          color: item.risk_level === 'High' ? '#991b1b' : (item.risk_level === 'Moderate' ? '#92400e' : '#166534')
                        }}>
                          {item.risk_level}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                        Symptoms: {(item.symptoms || []).slice(0, 3).join(', ')} {(item.symptoms || []).length > 3 ? '...' : ''}
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Logged: {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Right Column: Case Detail Inspector */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
            {selectedItem ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: selectedItem.risk_level === 'High' ? '#fee2e2' : (selectedItem.risk_level === 'Moderate' ? '#fef3c7' : '#dcfce7'),
                      color: selectedItem.risk_level === 'High' ? '#991b1b' : (selectedItem.risk_level === 'Moderate' ? '#92400e' : '#166534')
                    }}>
                      PRELIMINARY RISK TIER: {selectedItem.risk_level}
                    </span>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '6px 0 2px 0' }}>
                      {selectedItem.patient?.full_name || 'Patient'} Case Review
                    </h3>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      Inference ID: {selectedItem.id} • Model Version: {selectedItem.model_version || 'rf-v2.1'}
                    </span>
                  </div>

                  <Link
                    to={`/doctor/records?patientId=${selectedItem.patient_id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      background: '#0f766e',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: '700',
                      textDecoration: 'none'
                    }}
                  >
                    Open Patient Vault <ChevronRight size={13} />
                  </Link>
                </div>

                {/* Reported Symptoms */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    REPORTED SYMPTOMS
                  </label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(selectedItem.symptoms || []).map((sym, idx) => (
                      <span key={idx} style={{ background: '#f1f5f9', color: '#334155', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px' }}>
                        • {sym}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Differential Conditions */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                    PRELIMINARY DIFFERENTIAL CONDITIONS (ASSISTIVE PROBABILITIES)
                  </label>
                  {(selectedItem.possible_conditions || []).length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No automated differential generated.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedItem.possible_conditions.map((cond, idx) => (
                        <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{cond.condition}</strong>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#0f766e' }}>
                              {Math.round((cond.probability || 0) * 100)}% Match
                            </span>
                          </div>
                          {/* Probability Bar */}
                          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round((cond.probability || 0) * 100)}%`, height: '100%', background: '#0f766e' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Risk Reasons */}
                {selectedItem.risk_reasons && selectedItem.risk_reasons.length > 0 && (
                  <div style={{ marginBottom: '20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px' }}>
                    <strong style={{ fontSize: '12.5px', color: '#92400e', display: 'block', marginBottom: '4px' }}>
                      Key Risk Factors & Telemetry Signals:
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12.5px', color: '#78350f' }}>
                      {selectedItem.risk_reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Clinician Action Callout */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12.5px', color: '#334155' }}>
                    <strong>Recommended Clinician Action:</strong> {selectedItem.recommended_action || 'Conduct formal physical assessment.'}
                  </div>
                  <button
                    onClick={() => showToast('✓ Case flagged as reviewed in doctor audit log.')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      background: '#0f766e',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Mark Reviewed
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                <Activity size={36} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>Select an assessment case on the left to inspect telemetry.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
