import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  Heart, 
  Activity, 
  UserSquare2, 
  CheckCircle2, 
  Send,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  FolderKey,
  Smartphone,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { mlApi } from '../lib/mlApi';

export default function PatientTwin() {
  const { profile } = useAuth();
  
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  const [risks, setRisks] = useState({ heart_disease_risk: 15, diabetes_risk: 18, stroke_risk: 12 });
  const [loadingRisks, setLoadingRisks] = useState(false);
  const [latestPrediction, setLatestPrediction] = useState(null);
  
  const [askText, setAskText] = useState('');
  const [aiAnswers, setAiAnswers] = useState([
    { text: "Predictive Outlook: Initializing digital twin live sync..." }
  ]);
  const [asking, setAsking] = useState(false);

  // 1. Fetch patients list if logged in user is a doctor
  useEffect(() => {
    if (profile?.role === 'doctor') {
      setLoadingPatients(true);
      supabase
        .from('profiles')
        .select('*')
        .eq('role', 'patient')
        .then(({ data, error }) => {
          if (data && data.length > 0) {
            setPatients(data);
            setSelectedPatient(data[0]);
          }
          setLoadingPatients(false);
        });
    } else if (profile?.role === 'patient') {
      setSelectedPatient(profile);
    }
  }, [profile]);

  // 2. Fetch risks and latest prediction when selectedPatient changes
  useEffect(() => {
    if (!selectedPatient) return;
    
    // Fetch risks from ML service
    setLoadingRisks(true);
    mlApi.predictRisk({
      age: selectedPatient.age,
      bmi: selectedPatient.bmi,
      blood_sugar: selectedPatient.blood_sugar,
      bp_systolic: selectedPatient.bp_systolic,
      bp_diastolic: selectedPatient.bp_diastolic,
      smoking: selectedPatient.smoking
    })
      .then(data => {
        if (data) {
          setRisks(data);
        }
        setLoadingRisks(false);
      })
      .catch(err => {
        console.error("Error predicting risks:", err);
        setLoadingRisks(false);
      });

    // Fetch latest prediction from Supabase
    supabase
      .from('predictions')
      .select('*')
      .eq('patient_id', selectedPatient.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          setLatestPrediction(data[0]);
        } else {
          setLatestPrediction(null);
        }
      });
  }, [selectedPatient]);

  // Calculate Health Score: 100 - average of risks
  const avgRisk = (risks.heart_disease_risk + risks.diabetes_risk + risks.stroke_risk) / 3;
  const healthScore = Math.max(10, Math.min(99, Math.round(100 - avgRisk)));

  const trendData = [
    { name: 'Heart Risk', risk: Math.round(risks.heart_disease_risk) },
    { name: 'Diabetes Risk', risk: Math.round(risks.diabetes_risk) },
    { name: 'Stroke Risk', risk: Math.round(risks.stroke_risk) }
  ];

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!askText.trim() || !selectedPatient) return;

    setAsking(true);
    const userQuestion = askText;
    setAskText('');
    
    setAiAnswers(prev => [
      ...prev,
      { text: `Analyzing vital patterns for question "${userQuestion}"...` }
    ]);

    const context = `
      You are the MediMind AI Digital Twin assistant. 
      Here is the clinical profile of the patient:
      Name: ${selectedPatient.name}
      Age: ${selectedPatient.age}
      Gender: ${selectedPatient.gender}
      Vitals: Blood Sugar=${selectedPatient.blood_sugar} mg/dL, BMI=${selectedPatient.bmi}, BP=${selectedPatient.bp_systolic}/${selectedPatient.bp_diastolic} mmHg, Smoking=${selectedPatient.smoking === 1 ? 'Yes' : 'No'}.
      Calculated Risks: Heart Disease=${risks.heart_disease_risk}%, Diabetes=${risks.diabetes_risk}%, Stroke=${risks.stroke_risk}%.
      Latest Diagnosis: ${latestPrediction ? latestPrediction.predicted_disease : 'None recorded'}.
      
      The user asks: "${userQuestion}".
      Answer the question concisely in 1-2 sentences, referencing their specific vitals or risks where relevant, while maintaining professional medical guardrails.
    `;

    try {
      const reply = await mlApi.getChatReply(userQuestion, [
        { sender: 'patient', text: context }
      ]);
      setAiAnswers(prev => {
        // Remove the temporary "Analyzing..." message
        const updated = [...prev];
        updated[updated.length - 1] = { text: reply.text || reply };
        return updated;
      });
    } catch (err) {
      console.error(err);
      setAiAnswers(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { text: "Failed to connect to the Digital Twin AI assistant. Please try again." };
        return updated;
      });
    } finally {
      setAsking(false);
    }
  };

  const heartRate = selectedPatient ? 70 + (selectedPatient.age % 10) : 72;

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Top Patient Summary Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
              {selectedPatient ? `${selectedPatient.name}'s Twin` : 'Loading Twin Data...'}
            </h2>
            <span className="badge badge-normal" style={{ background: '#dcfce7', color: '#166534', borderRadius: '20px' }}>● Live Sync</span>
          </div>
          <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>
            Last sync: Just now via Apple Watch & CGM
          </p>
        </div>

        {/* Doctor Patient Selector */}
        {profile?.role === 'doctor' && patients.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Select Patient:</label>
            <select
              value={selectedPatient?.id || ''}
              onChange={(e) => {
                const found = patients.find(p => p.id === e.target.value);
                if (found) setSelectedPatient(found);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: 'white',
                fontWeight: '600',
                color: '#1e293b'
              }}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid: Health Score Graph & ABHA Card */}
      <div className="grid-main-sidebar" style={{ gridTemplateColumns: '1.4fr 0.8fr' }}>
        
        {/* Risk Trend & Score Indicator */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span className="stat-label">Model Risk Indices</span>
              <span className="badge badge-normal" style={{ background: healthScore > 75 ? '#dcfce7' : '#fef3c7', color: healthScore > 75 ? '#166534' : '#b45309', fontSize: '12px' }}>
                {healthScore > 75 ? 'Low Risk' : 'Moderate Risk'} ({Math.round(avgRisk)}/100)
              </span>
            </div>
            <div style={{ width: '100%', height: '120px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                  <Tooltip />
                  <Line type="monotone" dataKey="risk" stroke="#0a4bb5" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Circular Score display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
            <div style={{
              width: '90px', height: '90px', borderRadius: '50%',
              border: '8px solid #eff6ff', 
              borderTopColor: healthScore > 75 ? '#10b981' : '#f59e0b', 
              borderRightColor: healthScore > 75 ? '#10b981' : '#f59e0b',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
              <strong style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>{healthScore}</strong>
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Health Score</span>
            </div>
            <strong style={{ fontSize: '13.5px', color: healthScore > 75 ? '#10b981' : '#f59e0b', marginTop: '10px' }}>
              {healthScore > 75 ? 'Optimized' : 'Stable'}
            </strong>
            <a href="#score" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#0a4bb5', textDecoration: 'none', fontWeight: '700', marginTop: '4px' }}>
              How to improve <ArrowRight size={12} />
            </a>
          </div>
        </div>

        {/* ABHA Secure Identity Card */}
        <div style={{
          background: 'linear-gradient(135deg, #0a4bb5 0%, #032363 100%)',
          color: 'white',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#bfdbfe', letterSpacing: '0.5px' }}>National Health Authority</span>
              <strong style={{ display: 'block', fontSize: '18px', marginTop: '4px', fontWeight: '700' }}>
                {selectedPatient ? selectedPatient.name : 'No Patient Selected'}
              </strong>
              <span style={{ fontSize: '12px', color: '#93c5fd' }}>
                {selectedPatient?.abha_id || '91-0000-0000-0000'}
              </span>
            </div>
            <span className="badge badge-normal" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', fontSize: '8px' }}>
              Vault Secured
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px' }}>
            {/* Mock QR-code image */}
            <div style={{
              width: '40px', height: '40px', background: 'white', borderRadius: '4px', padding: '2px'
            }}>
              <div style={{ width: '100%', height: '100%', background: '#000', opacity: 0.1 }}></div>
            </div>
            
            <button 
              onClick={() => alert('Opening digital ABDM health locker...')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', color: 'white', padding: '6px', cursor: 'pointer' }}
            >
              <FolderKey size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Four Core Vitals metrics */}
      <div className="grid-4">
        
        {/* Heart Rate */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#ef4444', fontWeight: '700', fontSize: '12px' }}><Heart size={14} fill="#ef4444" /> Heart Rate</span>
            <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700' }}>Stable</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
            <strong style={{ fontSize: '24px', fontWeight: '800' }}>{heartRate}</strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>bpm</span>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#3b82f6', fontWeight: '700', fontSize: '12px' }}><Activity size={14} /> Blood Pressure</span>
            <span style={{ color: '#3b82f6', fontSize: '11px', fontWeight: '700' }}>Stable</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
            <strong style={{ fontSize: '24px', fontWeight: '800' }}>
              {selectedPatient ? `${selectedPatient.bp_systolic}/${selectedPatient.bp_diastolic}` : '120/80'}
            </strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>mmHg</span>
          </div>
        </div>

        {/* BMI */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#8b5cf6', fontWeight: '700', fontSize: '12px' }}><UserSquare2 size={14} /> BMI</span>
            <span style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: '700' }}>Stable</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
            <strong style={{ fontSize: '24px', fontWeight: '800' }}>
              {selectedPatient ? selectedPatient.bmi : '22.0'}
            </strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Index</span>
          </div>
        </div>

        {/* Blood Sugar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: '#10b981', fontWeight: '700', fontSize: '12px' }}>🟢 Blood Sugar</span>
            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: '700' }}>Live</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
            <strong style={{ fontSize: '24px', fontWeight: '800' }}>
              {selectedPatient ? selectedPatient.blood_sugar : '100'}
            </strong>
            <span style={{ fontSize: '12px', color: '#64748b' }}>mg/dL</span>
          </div>
        </div>

      </div>

      {/* Bottom Triage & Proactive Pathway */}
      <div className="grid-main-sidebar" style={{ gridTemplateColumns: '1.3fr 0.7fr' }}>
        
        {/* MediMind AI Analysis */}
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✨</span>
              <h3 className="card-title">MediMind AI Analysis</h3>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-normal" style={{ background: '#dcfce7', color: '#166534', fontSize: '9px' }}>Clinical Intelligence</span>
              {latestPrediction && (
                <span style={{ fontSize: '13px', color: '#166534', fontWeight: '700' }}>
                  {latestPrediction.reliability} Reliability
                </span>
              )}
            </div>
            
            <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>
              {latestPrediction ? latestPrediction.predicted_disease : 'No Diagnosis Recorded'}
            </strong>
            <p style={{ fontSize: '13.5px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>
              {latestPrediction 
                ? `Prediction confidence at ${latestPrediction.probability}%. Suggested specialist: ${latestPrediction.specialist}.`
                : 'No diagnostic predictions found. Run an evaluation on the Symptom Checker page to sync.'}
            </p>
            
            {latestPrediction?.caution && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ba1a1a', padding: '10px 14px', borderRadius: '6px', fontSize: '12.5px', marginTop: '10px' }}>
                ⚠️ {latestPrediction.caution}
              </div>
            )}
            
            {/* Timeline */}
            <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '16px', paddingTop: '16px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700', display: 'block', marginBottom: '10px' }}>Predictive Risk Timeline</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '11px', textAlign: 'center' }}>
                <div style={{ padding: '6px', background: '#eff6ff', borderLeft: '3px solid #0a4bb5', borderRadius: '4px' }}>Day 1: Onset</div>
                <div style={{ padding: '6px', background: '#eff6ff', borderLeft: '3px solid #0a4bb5', borderRadius: '4px' }}>Day 3: Peak</div>
                <div style={{ padding: '6px', background: '#dcfce7', borderLeft: '3px solid #10b981', borderRadius: '4px' }}>Day 6: Resolution</div>
              </div>
            </div>
          </div>

          {/* Mini interactive chatbot input */}
          <form onSubmit={handleAsk} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask AI about your recent vitals or calculated risks..."
              value={askText}
              onChange={e => setAskText(e.target.value)}
              style={{ fontSize: '13px' }}
              disabled={asking}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px' }} disabled={asking}>
              {asking ? '...' : <Send size={14} />}
            </button>
          </form>
          
          {aiAnswers.length > 0 && (
            <div style={{ fontSize: '12.5px', color: '#475569', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
              {aiAnswers[aiAnswers.length - 1].text}
            </div>
          )}
        </div>

        {/* Proactive Pathway */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title">Proactive Steps</h3>
            <a href="#proactive" style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>View All</a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            {/* Step 1 */}
            <div 
              onClick={() => alert('Opening doctor consult booking...')}
              style={{ display: 'flex', justifySelf: 'center', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                🏥
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Consult a Specialist</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Confirm AI diagnostics with clinical consult</span>
              </div>
              <ChevronRight size={14} color="#94a3b8" />
            </div>

            {/* Step 2 */}
            <div 
              onClick={() => alert('Accessing Lal PathLabs vault...')}
              style={{ display: 'flex', justifySelf: 'center', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                📁
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Complete Blood Vault</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Auto-fetch missing HbA1c report</span>
              </div>
              <ChevronRight size={14} color="#94a3b8" />
            </div>

            {/* Step 3 */}
            <div 
              onClick={() => alert('Syncing watch metrics...')}
              style={{ display: 'flex', justifySelf: 'center', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                🏃
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '13px', color: '#1e293b' }}>Calibrate Thresholds</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Syncing 20m light walk goal to watch</span>
              </div>
              <ChevronRight size={14} color="#94a3b8" />
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer style={{
        marginTop: '20px',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <span>🔐 MEDIMIND AI DIGITAL TWIN | End-to-End Encrypted | ABDM Compliant</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="#policy" style={{ color: '#64748b', textDecoration: 'none' }}>Security Policy</a>
          <a href="#emergency" style={{ color: '#64748b', textDecoration: 'none' }}>Emergency Contacts</a>
          <a href="#vault" style={{ color: '#64748b', textDecoration: 'none' }}>Vault Settings</a>
        </div>
      </footer>

    </div>
  );
}
