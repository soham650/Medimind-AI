import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Bell, 
  User, 
  Filter, 
  Play, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Zap, 
  FileText, 
  ShieldCheck, 
  ExternalLink, 
  Layers, 
  Lock, 
  Check, 
  ChevronRight,
  Info
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { aiService } from '../../services/ai.service';
import { useAuth } from '../../context/AuthContext';

export default function AiInsights() {
  const { user } = useAuth();
  const [selectedCase, setSelectedCase] = useState('Rajesh Kumar');
  const [actionAlert, setActionAlert] = useState(null);
  const [findingsQueue, setFindingsQueue] = useState([]);

  useEffect(() => {
    async function loadFindings() {
      try {
        const queue = await aiService.getClinicalFindingsQueue(user?.id);
        if (queue) setFindingsQueue(queue);
      } catch (err) {
        console.warn('Clinical findings queue note:', err);
      }
    }
    loadFindings();
  }, [user]);

  const calibrationData = [
    { x: 0, val: 0.05 },
    { x: 2, val: 0.15 },
    { x: 4, val: 0.35 },
    { x: 6, val: 0.70 },
    { x: 8, val: 0.88 },
    { x: 10, val: 0.95 }
  ];

  const handleAction = async (msg, findingId = null) => {
    setActionAlert(msg);
    if (findingId) {
      try {
        await aiService.signFindingOversight(findingId, user?.id || '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Oversight signing note:', err);
      }
    }
    setTimeout(() => setActionAlert(null), 4000);
  };


  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Clinical Header Bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search patients, MRN, lab orders, or clinical protocols..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              background: '#f8fafc'
            }}
          />
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '11px',
            fontWeight: '600',
            color: '#94a3b8',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '2px 5px'
          }}>⌘K</span>
        </div>

        {/* Right Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#dcfce7',
            color: '#166534',
            fontSize: '12px',
            fontWeight: '700',
            padding: '6px 12px',
            borderRadius: '9999px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            Cloud Sync: Active
          </span>

          <button 
            onClick={() => handleAction('🚨 Code Blue Protocol Broadcasted to Intensive Care Team.')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              fontSize: '12px',
              fontWeight: '700',
              padding: '6px 14px',
              borderRadius: '9999px',
              cursor: 'pointer'
            }}
          >
            <span>☢</span> Code Blue Alert
          </button>

          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={20} color="#475569" />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }}></span>
          </div>

          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
            SC
          </div>
        </div>
      </div>

      {actionAlert && (
        <div style={{ background: '#0a4bb5', color: '#ffffff', padding: '10px 24px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
          {actionAlert}
        </div>
      )}

      {/* Main Container */}
      <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Title and Top Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                ● Neural Engine v4.2 Active
              </span>
              <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                ● FHIR Pipeline Connected
              </span>
              <span style={{ background: '#f5f3ff', color: '#6d28d9', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px' }}>
                Confidence Baseline: 98.4%
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              AI Diagnostic Insights & Predictive Intelligence
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Continuous autonomous triage telemetry synthesized with multimodal patient EHR telemetry and clinical guardrails.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}>
              <Filter size={15} /> Filter by Severity
            </button>
            <button 
              onClick={() => handleAction('Executing Multi-Modal Neural Inference on active clinical cases...')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0a4bb5',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(10, 75, 181, 0.25)'
              }}
            >
              <Zap size={15} /> Run Multi-Modal Inference
            </button>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>ACTIVE PREDICTIONS</span>
              <Activity size={16} color="#0a4bb5" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>42</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>↗ +12%</span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>vs. previous 12h rotation shift</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#b91c1c', letterSpacing: '0.04em' }}>HIGH-CONFIDENCE ALERTS</span>
              <AlertTriangle size={16} color="#dc2626" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626' }}>06</span>
              <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                Critical Action Needed
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>Prompt action reduces escalation by 44%</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>DIAGNOSTIC CONCORDANCE</span>
              <ShieldCheck size={16} color="#16a34a" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>96.8%</span>
              <span style={{ background: '#f0fdf4', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                Peer Verified
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Across 1,480 senior clinical reviews</span>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>AVG TRIAGE LATENCY</span>
              <Zap size={16} color="#7c3aed" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a' }}>1.2s</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Sub-second stream</span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>Edge model deployed on local node</span>
          </div>

        </div>

        {/* 2-Column Main Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          
          {/* LEFT: Findings Queue & Inspector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Real-Time AI Clinical Findings Queue */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Activity size={18} color="#0a4bb5" />
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Real-Time AI Clinical Findings Queue
                  </h3>
                </div>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '9999px' }}>
                  Live Stream • 3 Pending Review
                </span>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Patient 1: Rajesh Kumar */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #fca5a5',
                  borderRadius: '10px',
                  padding: '16px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)',
                  borderLeft: '4px solid #dc2626'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                        RK
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>Rajesh Kumar</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>48M • Bed 412 (ICU Ward)</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>MRN-90241 • Admitted 14h ago</span>
                      </div>
                    </div>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px' }}>
                      Early Sepsis Biomarker Detection (91% Probability)
                    </span>
                  </div>

                  {/* Telemetry Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Serum Lactate</span>
                      <strong style={{ fontSize: '13px', color: '#dc2626' }}>3.4 <span style={{ fontSize: '10px', fontWeight: 'normal' }}>mmol/L</span></strong>
                      <span style={{ fontSize: '10px', color: '#dc2626', marginLeft: '4px' }}>↑ +0.9 in 2h</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Peripheral SpO2</span>
                      <strong style={{ fontSize: '13px', color: '#dc2626' }}>91%</strong>
                      <span style={{ fontSize: '10px', color: '#dc2626', marginLeft: '4px' }}>↓ from 96%</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>SIRS Vector Match</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>3 of 4</strong>
                      <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '4px' }}>Parameters met</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#334155', background: '#eff6ff', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', lineHeight: '1.4' }}>
                    <strong>Recommendation:</strong> Draw blood cultures stat x2 sites, initiate crystalloid IV fluids (30mL/kg protocol), order broad-spectrum empiric IV Piperacillin-Tazobactam.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleAction('Opening Neural Reasoning Chain for Pt. Rajesh Kumar')}
                      style={{ background: 'none', border: 'none', color: '#0a4bb5', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      View Reasoning Chain
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleAction('Alert dismissed for Pt. Rajesh Kumar')}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}
                      >
                        Override / Dismiss
                      </button>
                      <button 
                        onClick={() => handleAction('Order Dispatched: IV Piperacillin-Tazobactam + Blood Cultures stat x2')}
                        style={{ background: '#0a4bb5', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
                      >
                        Accept & Dispatch Order
                      </button>
                    </div>
                  </div>
                </div>

                {/* Patient 2: Priya Nair */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e9d5ff',
                  borderRadius: '10px',
                  padding: '16px',
                  borderLeft: '4px solid #9333ea'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3e8ff', color: '#7e22ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                        PN
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>Priya Nair</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>38F • Step-down Unit 204</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>MRN-88410 • Post-operative Day 2</span>
                      </div>
                    </div>
                    <span style={{ background: '#f3e8ff', color: '#7e22ce', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px' }}>
                      Cardiac Arrhythmia & QTc Prolongation Risk (84% Probability)
                    </span>
                  </div>

                  <div style={{ background: '#fdf4ff', border: '1px dashed #d8b4fe', padding: '10px 12px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#581c87' }}>
                      <strong>Drug-Drug Synergistic Interaction Flagged:</strong> Concurrent prescription of Azithromycin (500mg IV) with baseline Amiodarone therapy. Current QTc: 472ms.
                    </div>
                    <div style={{ textAlign: 'right', whiteSpace: 'nowrap', paddingLeft: '12px' }}>
                      <span style={{ fontSize: '10px', color: '#7e22ce', display: 'block' }}>PREDICTED QTC</span>
                      <strong style={{ fontSize: '14px', color: '#9333ea' }}>&gt;505ms</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#166534', background: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <strong>Suggested Alternate:</strong> Discontinue Azithromycin, Switch antimicrobial coverage to Amoxicillin-Clavulanate 1.2g IV or Cefuroxime to eliminate torsades risk.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button 
                      onClick={() => handleAction('Opening Pharmacology Audit for Pt. Priya Nair')}
                      style={{ background: 'none', border: 'none', color: '#0a4bb5', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Pharmacology Audit
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleAction('Acknowledge and monitoring set')}
                        style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}
                      >
                        Acknowledge & Monitor
                      </button>
                      <button 
                        onClick={() => handleAction('Rx modified to Amoxicillin-Clavulanate 1.2g IV')}
                        style={{ background: '#0a4bb5', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
                      >
                        Modify Rx
                      </button>
                    </div>
                  </div>
                </div>

                {/* Patient 3: Sunita Rao */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '16px',
                  borderLeft: '4px solid #0284c7'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                        SR
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>Sunita Rao</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>71F • Ward 3-B (Cardiology)</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>MRN-77310 • CHF Cohort</span>
                      </div>
                    </div>
                    <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: '800', padding: '4px 8px', borderRadius: '6px' }}>
                      Decompensated HF Exacerbation (79% Probability)
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Weight Delta (48h)</span>
                      <strong style={{ fontSize: '13px', color: '#dc2626' }}>+2.1 kg (Fluid Overload)</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Nurse Vitals Log</span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>2+ Bilateral pitting pedal edema</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button 
                      onClick={() => handleAction('Loop diuretic held for evaluation')}
                      style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#64748b', cursor: 'pointer' }}
                    >
                      Hold Loop Diuretic
                    </button>
                    <button 
                      onClick={() => handleAction('Order Placed: IV Furosemide 40mg')}
                      style={{ background: '#0a4bb5', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
                    >
                      Order IV Furosemide 40mg
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Multi-Modal AI Inference Inspector */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={18} color="#0a4bb5" />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Multi-Modal AI Inference Inspector
                    </h3>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Active Case: Rajesh Kumar (MRN-90241) • Correlated CXR + Lab Panels
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                  Model: Med-PaLM 2 / BioViL-T
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '20px' }}>
                
                {/* Left: Chest X-Ray with Attention Heatmap */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569' }}>AP VIEW • ATTENTION HEATMAP</span>
                    <span style={{ fontSize: '10.5px', color: '#0a4bb5', fontWeight: '700' }}>Grad-CAM Overlay</span>
                  </div>

                  {/* Radiograph Container */}
                  <div style={{
                    position: 'relative',
                    background: '#090d16',
                    borderRadius: '8px',
                    height: '210px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #1e293b'
                  }}>
                    {/* Simulated radiograph heatmap */}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'radial-gradient(ellipse at 40% 60%, rgba(220, 38, 38, 0.45) 0%, rgba(234, 88, 12, 0.3) 35%, rgba(15, 23, 42, 0.9) 70%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ textAlign: 'center', color: '#e2e8f0', fontSize: '12px' }}>
                        <div style={{ width: '130px', height: '110px', border: '1px dashed #ef4444', borderRadius: '6px', padding: '8px', background: 'rgba(239, 68, 68, 0.15)' }}>
                          <span style={{ fontSize: '10px', color: '#fca5a5', fontWeight: '700', display: 'block' }}>Segmented Bilateral Opacity</span>
                          <span style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', marginTop: '12px', display: 'block' }}>Confidence: 94.2%</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: '8px', left: '10px', fontSize: '10px', color: '#94a3b8' }}>
                      <span style={{ color: '#22c55e' }}>●</span> Consolidation (L & R base)
                    </div>
                    <div style={{ position: 'absolute', bottom: '8px', right: '10px', fontSize: '10px', color: '#94a3b8' }}>
                      Slice: 14/28
                    </div>
                  </div>
                </div>

                {/* Right: SHAP Feature Attribution */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#475569' }}>SHAP FEATURE ATTRIBUTION (LOCAL EXPLANATIONS)</span>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Sum: 0.89 Impact</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#1e293b', marginBottom: '3px' }}>
                        <span>C-Reactive Protein (CRP &gt; 140 mg/L)</span>
                        <span style={{ color: '#0a4bb5' }}>+0.42 Attribution</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '84%', height: '100%', background: '#0a4bb5', borderRadius: '3px' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#1e293b', marginBottom: '3px' }}>
                        <span>Tachypnea (RR 26 bpm sustained)</span>
                        <span style={{ color: '#0a4bb5' }}>+0.28 Attribution</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '56%', height: '100%', background: '#0a4bb5', borderRadius: '3px' }}></div>
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', color: '#1e293b', marginBottom: '3px' }}>
                        <span>Leukocytosis (WBC 17.8 x 10³/µL)</span>
                        <span style={{ color: '#0a4bb5' }}>+0.19 Attribution</span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: '38%', height: '100%', background: '#0a4bb5', borderRadius: '3px' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Neural Reasoning Text */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '11px', fontWeight: '800', marginBottom: '4px' }}>
                      <Sparkles size={13} /> CLINICAL NEURAL REASONING
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#334155', margin: 0, lineHeight: '1.45' }}>
                      "Patient presents with profound systemic inflammatory markers paired with acute radiographic bibasilar airspace disease. Corroborating dynamic lactate doubling over a 2-hour span with baseline borderline hypotension indicates high likelihood of septic shock development within 6 hours if intervention is delayed."
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Evidence, Oversight & Guardrails */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Evidence & Guidelines */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={17} color="#0a4bb5" />
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Evidence & Guidelines
                  </h3>
                </div>
                <Info size={15} color="#94a3b8" />
              </div>

              <p style={{ fontSize: '11.5px', color: '#64748b', lineHeight: '1.4', marginBottom: '14px' }}>
                Inference engine correlates real-time telemetry with peer-reviewed medical standards and clinical trial matrices.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '12px', fontWeight: '700' }}>
                    <CheckCircle2 size={14} /> Surviving Sepsis Campaign (2023 Update)
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    1-Hour Sepsis Bundle Guideline adherence score: 98%
                  </span>
                </div>

                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0a4bb5', fontSize: '12px', fontWeight: '700' }}>
                    <CheckCircle2 size={14} /> ACC/AHA 2024 Heart Failure Guidelines
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                    Section 4.3: Early Diuresis in Acute Decompensation
                  </span>
                </div>
              </div>

              {/* Calibration Curve */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>CALIBRATION SCORE DISTRIBUTION</span>
                  <span style={{ fontSize: '10px', color: '#166534', fontWeight: '800' }}>Expected Calibration Error: 0.018 (Optimal)</span>
                </div>
                <div style={{ height: '70px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={calibrationData}>
                      <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                  <span>0.0 (Uncertain)</span>
                  <span>Operating Target (0.85+)</span>
                  <span>1.0 (Definite)</span>
                </div>
              </div>
            </div>

            {/* Clinician Oversight Log */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={17} color="#166534" />
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Clinician Oversight Log
                  </h3>
                </div>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                  Shift 1
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                      SC
                    </div>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block' }}>Dr. Sarah Chen, MD</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>18 alerts reviewed (17 confirmed, 1 adjusted)</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: '12.5px', color: '#166534' }}>94.4%</strong>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#64748b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                      NV
                    </div>
                    <div>
                      <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block' }}>Dr. Neha Verma, MD</strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>9 neuro-radiology scans validated</span>
                    </div>
                  </div>
                  <strong style={{ fontSize: '12.5px', color: '#166534' }}>100%</strong>
                </div>
              </div>

              <button 
                onClick={() => handleAction('Opening Institutional Governance Audit')}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0a4bb5',
                  cursor: 'pointer'
                }}
              >
                View Complete Institutional Governance Audit
              </button>
            </div>

            {/* Active Guardrails */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ShieldCheck size={17} color="#0a4bb5" />
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Active Guardrails
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>HIPAA / ABDM M3 Standard</span>
                  <CheckCircle2 size={16} color="#16a34a" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Zero Hallucination Threshold</span>
                  <ShieldCheck size={16} color="#16a34a" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Physician Sign-Off Mandatory</span>
                  <Lock size={15} color="#0a4bb5" />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '12px', paddingTop: '8px', fontSize: '10.5px', color: '#94a3b8', textAlign: 'center' }}>
                Software as Medical Device (SaMD) Class IIa Regulated
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
