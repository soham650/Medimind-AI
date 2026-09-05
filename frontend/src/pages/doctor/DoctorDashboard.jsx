import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  ShieldCheck, 
  FileText, 
  Search, 
  Bell, 
  SlidersHorizontal, 
  HelpCircle, 
  Ambulance, 
  Video, 
  Check, 
  X, 
  Plus, 
  Printer, 
  Share2, 
  Download, 
  MoreVertical, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Activity,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function DoctorDashboard() {
  const { profile } = useAuth();

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWard, setSelectedWard] = useState('WARD 4B - CARDIAC');
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [ambulanceModal, setAmbulanceModal] = useState(false);
  const [radiologyAction, setRadiologyAction] = useState(null); // 'confirmed' | 'rejected' | null
  const [selectedPatientChart, setSelectedPatientChart] = useState(null);

  // Inpatients in Ward Census
  const [wardPatients, setWardPatients] = useState([
    {
      id: 'p1',
      name: 'Rajesh Kumar',
      initials: 'RK',
      avatarBg: '#eff6ff',
      avatarColor: '#2563eb',
      abhaId: '91-2384-2938-12',
      vitalsStatus: 'elevated', // 3 bars
      diagnosis: 'Post-Op (Cardiac)',
      diagnosisColor: '#f1f5f9',
      diagnosisText: '#334155',
      roomBed: '412 BED A',
      stabilityIndex: 'ELEVATED RISK',
      stabilityType: 'warning', // orange
      actionText: 'View Chart'
    },
    {
      id: 'p2',
      name: 'Ananya Sharma',
      initials: 'AS',
      avatarBg: '#fee2e2',
      avatarColor: '#dc2626',
      abhaId: '91-5582-1162-44',
      vitalsStatus: 'critical',
      diagnosis: 'Respiratory Failure',
      diagnosisColor: '#fef2f2',
      diagnosisText: '#b91c1c',
      roomBed: 'ICU BED 04',
      stabilityIndex: 'CRITICAL STATUS',
      stabilityType: 'danger', // red
      actionText: 'Urgent Action'
    },
    {
      id: 'p3',
      name: 'Vikram Das',
      initials: 'VD',
      avatarBg: '#dcfce7',
      avatarColor: '#16a34a',
      abhaId: '91-8821-4432-80',
      vitalsStatus: 'stable',
      diagnosis: 'Stable Observation',
      diagnosisColor: '#f8fafc',
      diagnosisText: '#475569',
      roomBed: '415 BED B',
      stabilityIndex: 'STABLE',
      stabilityType: 'success', // green
      actionText: 'View Chart'
    }
  ]);

  // Rounding Queue
  const [roundings, setRoundings] = useState([
    {
      id: 'r1',
      date: 'OCT 24',
      name: 'Samuel Richards',
      type: 'Tele-consult',
      time: '10:30 AM',
      icon: 'video'
    },
    {
      id: 'r2',
      date: 'OCT 24',
      name: 'Clinical Peer Review',
      type: 'Room 2C',
      time: '11:15 AM',
      icon: 'building'
    }
  ]);

  // Charts Data
  const throughputData = [
    { day: 'MON', admissions: 18, discharges: 12 },
    { day: 'TUE', admissions: 24, discharges: 16 },
    { day: 'WED', admissions: 22, discharges: 19 },
    { day: 'THU', admissions: 28, discharges: 21 },
    { day: 'FRI', admissions: 19, discharges: 25 },
    { day: 'SAT', admissions: 14, discharges: 17 },
    { day: 'SUN', admissions: 11, discharges: 13 }
  ];

  const precisionData = [
    { step: '0%', aiModel: 12, consensus: 8 },
    { step: '20%', aiModel: 25, consensus: 18 },
    { step: '40%', aiModel: 28, consensus: 27 },
    { step: '60%', aiModel: 48, consensus: 42 },
    { step: '80%', aiModel: 88, consensus: 81 },
    { step: '98.4%', aiModel: 98.4, consensus: 96 }
  ];

  const toggleSelectPatient = (id) => {
    setSelectedPatients(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPatients.length === wardPatients.length) {
      setSelectedPatients([]);
    } else {
      setSelectedPatients(wardPatients.map(p => p.id));
    }
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* 1. TOP BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Search Bar */}
        <div style={{
          flex: 1,
          maxWidth: '620px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '16px' }} />
          <input
            type="text"
            placeholder="Search patients by ABHA, Room, or Diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              paddingLeft: '44px',
              paddingRight: '60px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '13.5px',
              color: '#1e293b',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          />
          <span style={{
            position: 'absolute',
            right: '12px',
            fontSize: '11px',
            color: '#94a3b8',
            background: '#f1f5f9',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '600'
          }}>
            ⌘ K
          </span>
        </div>

        {/* Right Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setAmbulanceModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(185, 28, 28, 0.25)'
            }}
          >
            <Ambulance size={16} /> DISPATCH AMBULANCE
          </button>

          <button style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
            <Bell size={18} color="#475569" />
            <span style={{ position: 'absolute', top: '8px', right: '8px', width: '7px', height: '7px', background: '#dc2626', borderRadius: '50%' }}></span>
          </button>

          <button style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <SlidersHorizontal size={18} color="#475569" />
          </button>

          <button style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <HelpCircle size={18} color="#475569" />
          </button>
        </div>
      </div>

      {/* 2. STATS ROW (4 CARDS) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Card 1: Active Inpatients */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#2563eb" />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '2px' }}>
              ↗ 12.4%
            </span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>
            ACTIVE INPATIENTS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', lineHeight: '1.1', marginTop: '4px' }}>
            128
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
            Avg. LOS: 4.2 days
          </div>
        </div>

        {/* Card 2: Critical Alerts */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#dc2626" />
            </div>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#dc2626', background: '#fee2e2', padding: '3px 8px', borderRadius: '9999px', textTransform: 'uppercase' }}>
              Urgent Action
            </span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>
            CRITICAL ALERTS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#dc2626', lineHeight: '1.1', marginTop: '4px' }}>
            03
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
            2 Tachycardia, 1 Hypoxemia
          </div>
        </div>

        {/* Card 3: AI Precision Index */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="#16a34a" />
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>Last 24h</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>
            AI PRECISION INDEX
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#16a34a', lineHeight: '1.1', marginTop: '4px' }}>
            98.2<span style={{ fontSize: '20px' }}>%</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: '98.2%', height: '100%', background: '#16a34a' }}></div>
          </div>
        </div>

        {/* Card 4: Pending Lab Reports */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color="#2563eb" />
            </div>
          </div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '12px' }}>
            PENDING LAB REPORTS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', lineHeight: '1.1', marginTop: '4px' }}>
            14
          </div>
          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '6px' }}>
            Median TAT: 2.1 hrs
          </div>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: WARD CENSUS (LEFT 68%) + AI DIAGNOSTIC AGENT & ROUNDING (RIGHT 32%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.9fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* LEFT COLUMN: WARD CENSUS */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Census Header & Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>Ward Census</h2>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '6px' }}>
                    {selectedWard}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                  Real-time status of 24 allocated beds
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  Selected ({selectedPatients.length})
                </button>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <Users size={14} /> Assign
                </button>
                <button
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={14} />
                </button>
                <button
                  style={{
                    padding: '7px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#0a4bb5',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Bulk Action
                </button>
              </div>
            </div>

            {/* Census Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '10px 8px', width: '28px' }}>
                      <input
                        type="checkbox"
                        checked={selectedPatients.length === wardPatients.length && wardPatients.length > 0}
                        onChange={selectAll}
                      />
                    </th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', textTransform: 'uppercase', fontSize: '10.5px' }}>PATIENT & ABHA</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', textTransform: 'uppercase', fontSize: '10.5px' }}>VITALS STATUS</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', textTransform: 'uppercase', fontSize: '10.5px' }}>PRIMARY DIAGNOSIS</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', textTransform: 'uppercase', fontSize: '10.5px' }}>ROOM/BED</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700', textTransform: 'uppercase', fontSize: '10.5px' }}>STABILITY INDEX</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {wardPatients.map(pt => {
                    const isChecked = selectedPatients.includes(pt.id);
                    return (
                      <tr key={pt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 8px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectPatient(pt.id)}
                          />
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: pt.avatarBg,
                              color: pt.avatarColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '700',
                              fontSize: '12px'
                            }}>
                              {pt.initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: '700', color: '#0f172a' }}>{pt.name}</div>
                              <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>ABHA: {pt.abhaId}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          {/* 3 Waves indicator */}
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                            <span style={{ width: '4px', height: '14px', borderRadius: '2px', background: pt.vitalsStatus === 'critical' ? '#dc2626' : (pt.vitalsStatus === 'elevated' ? '#16a34a' : '#16a34a') }}></span>
                            <span style={{ width: '4px', height: '22px', borderRadius: '2px', background: pt.vitalsStatus === 'critical' ? '#dc2626' : (pt.vitalsStatus === 'elevated' ? '#16a34a' : '#16a34a') }}></span>
                            <span style={{ width: '4px', height: '10px', borderRadius: '2px', background: pt.vitalsStatus === 'critical' ? '#dc2626' : (pt.vitalsStatus === 'elevated' ? '#16a34a' : '#16a34a') }}></span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            background: pt.diagnosisColor,
                            color: pt.diagnosisText,
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {pt.diagnosis}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', fontWeight: '700', color: '#334155' }}>
                          {pt.roomBed}
                        </td>
                        <td style={{ padding: '14px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: '800',
                            background: pt.stabilityType === 'danger' ? '#fee2e2' : (pt.stabilityType === 'warning' ? '#fef3c7' : '#dcfce7'),
                            color: pt.stabilityType === 'danger' ? '#b91c1c' : (pt.stabilityType === 'warning' ? '#b45309' : '#166534')
                          }}>
                            ● {pt.stabilityIndex}
                          </span>
                        </td>
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedPatientChart(pt)}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#0a4bb5',
                              fontWeight: '700',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            {pt.actionText}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer with Pagination */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#64748b' }}>
            <span>Showing 3 of 24 active beds</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronLeft size={14} />
              </button>
              <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI DIAGNOSTIC AGENT & ROUNDING QUEUE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Card 1: AI Diagnostic Agent */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #16a34a',
            padding: '18px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: '13.5px', color: '#0f172a' }}>
                <Activity size={16} color="#16a34a" /> AI Diagnostic Agent
              </div>
              <a href="#" style={{ fontSize: '11px', fontWeight: '700', color: '#0a4bb5', textDecoration: 'none' }}>
                REVIEW LOG
              </a>
            </div>

            {/* Diagnostic Narrative Box */}
            <div style={{ background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#2563eb', textTransform: 'uppercase' }}>
                  RADIOLOGY REVIEW ⓘ
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>2m ago</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Pt. Rajesh Kumar</div>
              <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.45', marginTop: '4px' }}>
                Suspected localized effusion in lower left lobe. Suggest Thoracentesis evaluation for pleural fluid analysis.
              </p>

              {/* Confidence Level */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: '700', color: '#64748b' }}>
                  <span>CONFIDENCE LEVEL</span>
                  <span style={{ color: '#16a34a' }}>84.2% (High)</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: '#e2e8f0', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '84.2%', height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #16a34a 100%)' }}></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button
                  onClick={() => setRadiologyAction('confirmed')}
                  disabled={radiologyAction !== null}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: radiologyAction === 'confirmed' ? '#166534' : '#16a34a',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={14} /> {radiologyAction === 'confirmed' ? 'Confirmed' : 'Confirm'}
                </button>
                <button
                  onClick={() => setRadiologyAction('rejected')}
                  disabled={radiologyAction !== null}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: '700',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </div>

            {/* ECG Pattern Verified Badge Item */}
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
              <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase' }}>
                  ECG PATTERN VERIFIED
                </span>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                  Sinus Arrhythmia confirmed by Human Validation (Dr. Gupta)
                </p>
              </div>
            </div>

            {/* Bottom Link */}
            <a
              href="#"
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: '800',
                color: '#0a4bb5',
                textDecoration: 'none',
                paddingTop: '6px'
              }}
            >
              VIEW COMPLETE ANALYSIS QUEUE
            </a>
          </div>

          {/* Card 2: Rounding Queue */}
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '18px',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ROUNDING QUEUE
              </h3>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0a4bb5' }}>
                <Plus size={16} />
              </button>
            </div>

            {/* Rounding items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {roundings.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ background: '#eff6ff', color: '#2563eb', padding: '6px 8px', borderRadius: '6px', textAlign: 'center', fontSize: '10px', fontWeight: '800' }}>
                    OCT<br /><span style={{ fontSize: '13px' }}>24</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{r.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      {r.icon === 'video' ? <Video size={12} /> : <Building size={12} />}
                      {r.time} · {r.type}
                    </div>
                  </div>
                  <MoreVertical size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
                </div>
              ))}
            </div>

            {/* Manage Full Schedule button */}
            <button
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '10px',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '11.5px',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              MANAGE FULL SCHEDULE
            </button>
          </div>
        </div>

      </div>

      {/* 4. BOTTOM SECTION: 2 CHARTS SIDE BY SIDE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        
        {/* Chart 1: Patient Throughput */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Patient Throughput</h3>
              <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                Inflow vs. Outflow Trends (Weekly Aggregate)
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11.5px', color: '#334155' }}>
              <span>Last 30 Days</span>
              <SlidersHorizontal size={12} />
            </div>
          </div>

          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="admissions" fill="#0a4bb5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="discharges" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '11px', fontWeight: '800', color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: '#0a4bb5', borderRadius: '2px' }}></span> ADMISSIONS
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', background: '#14b8a6', borderRadius: '2px' }}></span> DISCHARGES
            </span>
          </div>
        </div>

        {/* Chart 2: Diagnostic Precision */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Diagnostic Precision</h3>
              <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                AI Accuracy Index vs. Clinical Gold Standard
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <Share2 size={16} />
              </button>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <Download size={16} />
              </button>
            </div>
          </div>

          <div style={{ height: '220px', width: '100%', position: 'relative' }}>
            {/* Tooltip Overlay matching exact UI */}
            <div style={{
              position: 'absolute',
              top: '20px',
              right: '60px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '6px 12px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.06)',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#0a4bb5' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0a4bb5' }}></span> CURRENT NODE
              </div>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>98.4%</div>
              <div style={{ fontSize: '10px', color: '#dc2626' }}>↘ Variance: -0.2%</div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={precisionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} />
                <Line type="monotone" dataKey="aiModel" stroke="#0a4bb5" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="consensus" stroke="#14b8a6" strokeWidth={1.8} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '12px', fontSize: '11px', fontWeight: '800', color: '#475569' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '2px', background: '#0a4bb5' }}></span> AI MODEL V4.2 PRO
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '2px', borderTop: '2px dashed #14b8a6' }}></span> CLINICAL PEER CONSENSUS
            </span>
          </div>
        </div>

      </div>

      {/* 5. COMPLIANCE & MISSION CONTROL FOOTER */}
      <footer style={{
        borderTop: '1px solid #e2e8f0',
        paddingTop: '24px',
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '11.5px',
        color: '#64748b'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: '#0f172a' }}>
            <ShieldCheck size={16} color="#0a4bb5" /> MediMind Clinical Mission Control
          </div>
          <p style={{ marginTop: '2px', color: '#94a3b8' }}>
            © 2026 MEDIMIND INTELLIGENCE CORP. SECURE CLINICAL ENVIRONMENT
          </p>
        </div>

        {/* Compliance Badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>COMPLIANCE ARCHITECTURE:</span>
            <span style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>HIPAA</span>
            <span style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>GDPR</span>
            <span style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>SOC2 TYPE II</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>DATA INTEROPERABILITY:</span>
            <span style={{ padding: '2px 6px', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>HL7® FHIR® R4</span>
            <span style={{ padding: '2px 6px', background: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>DICOM 3.0</span>
          </div>
        </div>

        {/* Legal & Status */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>PRIVACY</a>
          <a href="#" style={{ color: '#64748b', textDecoration: 'none' }}>TERMS</a>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '700' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span> SYSTEM STATUS
          </span>
        </div>
      </footer>

      {/* Ambulance Dispatch Modal */}
      {ambulanceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            textAlign: 'center'
          }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
              <Ambulance size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Emergency Ambulance Dispatch</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', lineHeight: '1.5' }}>
              Dispatching Level-1 Cardiac Life Support unit to <strong>Ward 4B (Bed 412)</strong>. Immediate traffic priority beacon requested.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => setAmbulanceModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('AMBULANCE DISPATCH CONFIRMED: Unit #MED-992 en route.');
                  setAmbulanceModal(false);
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Chart Modal */}
      {selectedPatientChart && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{selectedPatientChart.name}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>ABHA: {selectedPatientChart.abhaId} | Room: {selectedPatientChart.roomBed}</span>
              </div>
              <button onClick={() => setSelectedPatientChart(null)} style={{ border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Primary Diagnosis:</strong> {selectedPatientChart.diagnosis}</div>
              <div><strong>Stability Index:</strong> {selectedPatientChart.stabilityIndex}</div>
              <div><strong>Telemetry:</strong> Sinus Rhythm, SpO2 96%, BP 132/84 mmHg</div>
              <div><strong>Attending Physician:</strong> Dr. Sarah Chen (Chief of Cardiology)</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                to="/doctor/prescribe"
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#0a4bb5',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  textAlign: 'center',
                  textDecoration: 'none'
                }}
              >
                Issue Prescription
              </Link>
              <button
                onClick={() => setSelectedPatientChart(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
