import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { 
  Users, 
  AlertOctagon, 
  Activity, 
  Clock, 
  FolderHeart,
  CalendarCheck,
  CheckCircle,
  XCircle,
  ChevronRight,
  TrendingUp,
  FileHeart
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { doctorService } from '../services/doctor.service';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeInpatientsCount: 128,
    criticalAlertsCount: 3,
    aiPrecisionIndex: 98.2,
    pendingLabReportsCount: 14
  });

  // Ward census data
  const [patients, setPatients] = useState([
    { 
      id: 'pat1', 
      name: 'Rajesh Kumar', 
      abha: '91-2384-2938-12', 
      diagnosis: 'Post-Op Recovery (Cardiac)', 
      room: '412 BED A', 
      risk: 'ELEVATED RISK', 
      riskClass: 'badge-warning',
      vitalsState: [70, 75, 80]
    },
    { 
      id: 'pat2', 
      name: 'Ananya Sharma', 
      abha: '91-5582-1102-44', 
      diagnosis: 'Respiratory Failure', 
      room: 'ICU BED 04', 
      risk: 'CRITICAL STATUS', 
      riskClass: 'badge-critical',
      vitalsState: [90, 85, 95]
    },
    { 
      id: 'pat3', 
      name: 'Vikram Das', 
      abha: '91-8821-4432-90', 
      diagnosis: 'Stable Observation', 
      room: '415 BED B', 
      risk: 'STABLE', 
      riskClass: 'badge-normal',
      vitalsState: [60, 62, 61]
    }
  ]);

  // Rounding Schedule
  const [rounds, setRounds] = useState([
    { name: 'Samuel Richards', time: '10:30 AM', type: 'Tele-consult' },
    { name: 'Clinical Peer Review', time: '11:15 AM', type: 'Room 2C' },
    { name: 'Priya Verma', time: '12:00 PM', type: 'In-person' }
  ]);

  useEffect(() => {
    if (user?.id) {
      doctorService.getMissionControlData(user.id).then(data => {
        setStats({
          activeInpatientsCount: data.activeInpatientsCount,
          criticalAlertsCount: data.criticalAlertsCount,
          aiPrecisionIndex: data.aiPrecisionIndex,
          pendingLabReportsCount: data.pendingLabReportsCount
        });
        if (data.todaySchedule && data.todaySchedule.length > 0) {
          setRounds(data.todaySchedule.map(s => ({
            name: s.patients?.full_name || 'Scheduled Patient',
            time: s.time_slot,
            type: s.consultation_type === 'video' ? 'Tele-consult' : 'In-person'
          })));
        }
        if (data.inpatientCensus && data.inpatientCensus.length > 0) {
          setPatients(data.inpatientCensus.map((p, idx) => ({
            id: p.id,
            name: p.name,
            abha: p.abha,
            diagnosis: p.diagnosis,
            room: `BED 0${idx + 1}`,
            risk: p.risk,
            riskClass: 'badge-warning',
            vitalsState: [70, 78, 82]
          })));
        }
        setLoading(false);
      }).catch(err => {
        console.error('Error hydrating dashboard stats:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  // Mock throughput data (Admissions vs Discharges)
  const throughputData = [
    { name: 'MON', admissions: 12, discharges: 8 },
    { name: 'TUE', admissions: 19, discharges: 15 },
    { name: 'WED', admissions: 15, discharges: 18 },
    { name: 'THU', admissions: 22, discharges: 14 },
    { name: 'FRI', admissions: 18, discharges: 20 }
  ];

  // Mock AI model accuracy over weeks
  const precisionData = [
    { name: 'W1', model: 96.5, consensus: 97.2 },
    { name: 'W2', model: 97.2, consensus: 97.4 },
    { name: 'W3', model: 98.4, consensus: 98.1 },
    { name: 'W4', model: 97.9, consensus: 98.3 },
    { name: 'W5', model: 98.2, consensus: 98.4 }
  ];

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Metric Indicators Row */}
      <div className="stat-card-grid">
        <div className="stat-card" style={{ borderLeft: '4px solid #0a4bb5' }}>
          <span className="stat-label">Active Inpatients</span>
          <div className="stat-value">{stats.activeInpatientsCount}</div>
          <div className="stat-footer" style={{ color: '#166534', fontWeight: '600' }}>
            ↗ 12.4% <span style={{ color: '#64748b', fontWeight: 'normal' }}>Avg. LOS: 4.2 days</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #c21a1a' }}>
          <span className="stat-label">Critical Alerts</span>
          <div className="stat-value" style={{ color: '#c21a1a' }}>
            {stats.criticalAlertsCount < 10 ? `0${stats.criticalAlertsCount}` : stats.criticalAlertsCount}
          </div>
          <div className="stat-footer" style={{ color: '#991b1b', fontWeight: '600' }}>
            Urgent Action <span style={{ color: '#64748b', fontWeight: 'normal' }}>Tachycardia, Hypoxemia</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <span className="stat-label">AI Precision Index</span>
          <div className="stat-value">{stats.aiPrecisionIndex}%</div>
          <div className="stat-footer" style={{ color: '#166534', fontWeight: '600' }}>
            Last 24h <span style={{ color: '#64748b', fontWeight: 'normal' }}>Clinical Validation High</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <span className="stat-label">Pending Lab Reports</span>
          <div className="stat-value">{stats.pendingLabReportsCount}</div>
          <div className="stat-footer" style={{ color: '#92400e', fontWeight: '600' }}>
            Median TAT: 2.1 hrs
          </div>
        </div>
      </div>

      {/* Main Grid: Ward Census + AI Diagnostic review */}
      <div className="grid-main-sidebar">
        
        {/* Left Column: Ward Census */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-title">Ward Census</h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>Real-time status of 24 allocated beds (Ward 4B - Cardiac)</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Filters</button>
              <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Export Records</button>
            </div>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient & ABHA</th>
                <th>Vitals Status</th>
                <th>Primary Diagnosis</th>
                <th>Room/Bed</th>
                <th>Stability Index</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        color: '#0a4bb5'
                      }}>
                        {p.name.split(' ').map(n => n.charAt(0)).join('')}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#1e293b' }}>{p.name}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>ABHA: {p.abha}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {/* Visual vitals sparkline simulation */}
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '24px' }}>
                      {p.vitalsState.map((val, idx) => (
                        <span key={idx} style={{
                          display: 'inline-block',
                          width: '4px',
                          height: `${(val / 100) * 24}px`,
                          background: p.id === 'pat2' ? '#c21a1a' : '#10b981',
                          borderRadius: '1px'
                        }} />
                      ))}
                    </div>
                  </td>
                  <td style={{ color: '#475569', fontWeight: '500' }}>{p.diagnosis}</td>
                  <td style={{ color: '#475569', fontWeight: '600' }}>{p.room}</td>
                  <td>
                    <span className={`badge ${p.riskClass}`}>{p.risk}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {p.id === 'pat2' ? (
                      <button 
                        onClick={() => alert('Dispatching emergency physician to ICU Bed 04...')}
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                      >
                        Urgent Action
                      </button>
                    ) : (
                      <a href="#chart" style={{ fontSize: '13px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>View Chart</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right Sidebar: AI Diagnostic Agent Review Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Diagnostic Agent */}
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <h4 style={{ fontWeight: '700' }} className="card-title">AI Diagnostic Agent</h4>
              <span className="badge badge-normal" style={{ fontSize: '10px' }}>Review Log</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Alert 1 */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                  <span>Radiology Review Required</span>
                  <span>2m ago</span>
                </div>
                <strong style={{ display: 'block', fontSize: '13.5px', marginTop: '6px', color: '#1e293b' }}>Pt. Rajesh Kumar</strong>
                <p style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>
                  AI suggests potential localized effusion in lower left lobe. Suggest Thoracentesis evaluation for pleural fluid analysis.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#10b981' }}>Confidence: <strong>84.2% (High)</strong></span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => alert('AI Prediction Confirmed')} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', background: '#dcfce7', color: '#166534', border: 'none' }}><CheckCircle size={12} /> Confirm</button>
                    <button onClick={() => alert('AI Prediction Rejected')} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px', background: '#fee2e2', color: '#991b1b', border: 'none' }}><XCircle size={12} /> Reject</button>
                  </div>
                </div>
              </div>

              {/* Alert 2 */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', textTransform: 'uppercase', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <CheckCircle size={12} /> ECG Pattern Verified
                </span>
                <strong style={{ display: 'block', fontSize: '13.5px', marginTop: '6px', color: '#1e293b' }}>Pt. Sarah Jenkins</strong>
                <p style={{ fontSize: '12.5px', color: '#475569', marginTop: '4px' }}>
                  Diagnosis: Sinus Arrhythmia confirmed by Human Validation (Dr. Gupta).
                </p>
              </div>

              <a href="#queue" style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none', marginTop: '4px' }}>
                View Complete Analysis Queue →
              </a>
            </div>
          </div>

          {/* Rounding schedule widget */}
          <div className="card">
            <h4 className="card-title" style={{ marginBottom: '16px' }}>Rounding Queue</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rounds.map((round, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{round.name}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{round.type}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#0a4bb5' }}>{round.time}</span>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '16px', padding: '10px' }}>
              Manage Full Schedule
            </button>
          </div>

        </div>
      </div>

      {/* Bottom Section: Charts */}
      <div className="grid-2">
        {/* Throughput admissions vs discharges */}
        <div className="card">
          <div className="card-title-container">
            <h3 className="card-title">Patient Throughput</h3>
            <span className="badge badge-normal" style={{ textTransform: 'none' }}>Last 7 Days</span>
          </div>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="admissions" fill="#94a3b8" name="Admissions" radius={[4, 4, 0, 0]} />
                <Bar dataKey="discharges" fill="#10b981" name="Discharges" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnostic Precision linechart */}
        <div className="card">
          <div className="card-title-container">
            <h3 className="card-title">Diagnostic Precision</h3>
            <span className="badge badge-normal" style={{ textTransform: 'none' }}>Last 30 Days</span>
          </div>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={precisionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="model" stroke="#0a4bb5" strokeWidth={2.5} name="AI Model v4.2 Pro" />
                <Line type="monotone" dataKey="consensus" stroke="#10b981" strokeWidth={2.5} strokeDasharray="5 5" name="Clinical Peer Consensus" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Footer block */}
      <footer style={{
        marginTop: '20px',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <span>🛡️ MediMind Clinical Mission Control | HIPAA, GDPR, SOC2 Type II Certified</span>
        <span>Data Interoperability Standards: <strong>HL7 FHIR R4, DICOM 3.0</strong></span>
      </footer>

    </div>
  );
}
