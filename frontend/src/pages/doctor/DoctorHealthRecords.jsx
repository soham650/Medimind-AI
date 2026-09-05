import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Bell, 
  Download, 
  Share2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  Lock, 
  Filter, 
  UploadCloud, 
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function DoctorHealthRecords() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState('lipid');
  const [toastMessage, setToastMessage] = useState(null);

  const longitudinalTrend = [
    { date: 'May 2022', total: 265, ldl: 208, hdl: 39 },
    { date: 'Nov 2022', total: 248, ldl: 192, hdl: 40 },
    { date: 'Jun 2023', total: 235, ldl: 178, hdl: 42 },
    { date: 'Jan 2024', total: 238, ldl: 172, hdl: 43 },
    { date: 'Oct 2024', total: 242, ldl: 164, hdl: 44 }
  ];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
            onClick={() => showToast('🚨 Code Blue Protocol broadcasted.')}
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

      {toastMessage && (
        <div style={{ background: '#0a4bb5', color: '#ffffff', padding: '10px 24px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Title and Top Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                ABDM 2.0 CONNECTED
              </span>
              <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                🛡 Vault Encryption: SHA-256 Validated
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Longitudinal Health Records & Unified EHR Vault
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => showToast('FHIR R4 Bundle sync completed with National Health Stack.')}
              style={{
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
              }}
            >
              <RefreshCw size={14} /> FHIR Bundle Sync
            </button>
            <button 
              onClick={() => showToast('Exporting encrypted bundle to ABDM Health Locker...')}
              style={{
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
              }}
            >
              <Share2 size={14} /> Export to ABDM
            </button>
            <button 
              onClick={() => showToast('Opening Secure Medical Document Uploader...')}
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
              <UploadCloud size={15} /> Upload New EHR Document
            </button>
          </div>
        </div>

        {/* Patient Information Banner */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '10px',
              background: '#0a4bb5',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '16px'
            }}>
              RS
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Rahul Sharma</h2>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>32M</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#0a4bb5', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>O+ POSITIVE</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                <strong>ABHA ID:</strong> 91-2345-6789-0123 &nbsp;•&nbsp; <strong>Attending:</strong> Dr. Sarah Chen, MD
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', fontSize: '12px' }}>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700' }}>ALLERGIES</span>
              <span style={{ color: '#dc2626', fontWeight: '800' }}>⚠ Penicillin (Severe)</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700' }}>CURRENT REGIMEN</span>
              <span style={{ color: '#1e293b', fontWeight: '700' }}>Atorvastatin 20mg, Aspirin 75mg</span>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block', fontSize: '11px', fontWeight: '700' }}>VAULT ID</span>
              <span style={{ color: '#1e293b', fontWeight: '700' }}>SHR-EHR-99214</span>
            </div>
          </div>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }}></span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e40af' }}>Digital Consent: Active (ABDM)</span>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {[
            { id: 'all', label: 'All Documents (58)' },
            { id: 'labs', label: 'Lab Reports (24)' },
            { id: 'imaging', label: 'Imaging & Scans (12)' },
            { id: 'rx', label: 'Prescriptions (14)' },
            { id: 'discharge', label: 'Discharge Summaries (8)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#0a4bb5' : '#ffffff',
                color: activeTab === tab.id ? '#ffffff' : '#475569',
                border: '1px solid #e2e8f0',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Longitudinal Care Chronology (2021 — 2025) */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
              Longitudinal Care Chronology (2021 — 2025)
            </span>
            <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
              <span style={{ color: '#dc2626' }}>● Acute Inpatient</span>
              <span style={{ color: '#2563eb' }}>● Diagnostic Panel</span>
              <span style={{ color: '#16a34a' }}>● Ambulatory Check</span>
            </div>
          </div>

          {/* Timeline bar */}
          <div style={{ position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', width: '100%', height: '4px', background: '#e2e8f0', borderRadius: '2px' }}></div>
            
            <div style={{ position: 'absolute', left: '15%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb', margin: '0 auto 4px auto' }}></div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Nov 2021</span>
            </div>

            <div style={{ position: 'absolute', left: '38%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2563eb', margin: '0 auto 4px auto' }}></div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Aug 2022</span>
            </div>

            <div style={{ position: 'absolute', left: '68%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#dc2626', margin: '0 auto 4px auto' }}></div>
              <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: '700' }}>May 2024</span>
            </div>

            <div style={{ position: 'absolute', left: '86%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#0a4bb5', border: '2px solid #ffffff', boxShadow: '0 0 0 2px #0a4bb5', margin: '0 auto 4px auto' }}></div>
              <span style={{ fontSize: '10.5px', color: '#0a4bb5', fontWeight: '800', background: '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                Lipid Profile Audit (Oct 20, 2024)
              </span>
            </div>

            <div style={{ position: 'absolute', left: '98%', transform: 'translateX(-50%)', textAlign: 'center' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#94a3b8', margin: '0 auto 4px auto' }}></div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>2025</span>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Clinical Repository vs Document Inspector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
          
          {/* LEFT: Clinical Repository (58 Records) */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={17} color="#0a4bb5" />
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Clinical Repository
                  </h3>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b' }}>58 Records</span>
              </div>

              <div style={{ position: 'relative' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="Search reports by ICD-10, LOINC, doctor, hospital..."
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: '#64748b' }}>
                <span>Sort: <strong>Most Recent First</strong></span>
                <span style={{ color: '#0a4bb5', cursor: 'pointer', fontWeight: '700' }}>Filter Tags</span>
              </div>
            </div>

            {/* List of records */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Record 1: Comprehensive Metabolic & Lipid Profile (Selected) */}
              <div 
                onClick={() => setSelectedRecord('lipid')}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: selectedRecord === 'lipid' ? '#eff6ff' : '#ffffff',
                  borderLeft: selectedRecord === 'lipid' ? '4px solid #0a4bb5' : '4px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Comprehensive Metabolic & Lipid Profile
                  </div>
                  <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                    Critical LDL
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                  Thyrocare / LabCorp • Pathologist: Dr. N. Rao
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <span style={{ color: '#16a34a', fontWeight: '600' }}>✓ Verified Oct 20, 2024</span>
                  <span>LOINC 24331-1</span>
                </div>
              </div>

              {/* Record 2: ECG Report */}
              <div 
                onClick={() => setSelectedRecord('ecg')}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: selectedRecord === 'ecg' ? '#eff6ff' : '#ffffff',
                  borderLeft: selectedRecord === 'ecg' ? '4px solid #0a4bb5' : '4px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    12-Lead Electrocardiogram (ECG) Report
                  </div>
                  <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                    Borderline
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                  City General Hospital • Cardiology Outpatient • Dr. Sarah Chen
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <span>✓ Sinus Tachycardia (104 bpm)</span>
                  <span>Sep 14, 2024</span>
                </div>
              </div>

              {/* Record 3: Contrast-Enhanced Chest CT Scan */}
              <div 
                onClick={() => setSelectedRecord('ct')}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: selectedRecord === 'ct' ? '#eff6ff' : '#ffffff',
                  borderLeft: selectedRecord === 'ct' ? '4px solid #0a4bb5' : '4px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Contrast-Enhanced Chest CT Scan
                  </div>
                  <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                    DICOM Synced
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                  Metropolitan Diagnostic Center • Radiologist: Dr. P. Joshi
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <span>Findings: Mild subsegmental atelectasis</span>
                  <span>Jun 10, 2024</span>
                </div>
              </div>

              {/* Record 4: ABDM Digital Rx Bundle */}
              <div 
                onClick={() => setSelectedRecord('rx')}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: selectedRecord === 'rx' ? '#eff6ff' : '#ffffff',
                  borderLeft: selectedRecord === 'rx' ? '4px solid #0a4bb5' : '4px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    ABDM Digital Prescription Bundle #2024-881
                  </div>
                  <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                    Active Rx
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                  Prescribed by Dr. Arjun Mehta • Max Healthcare Ambulatory
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <span>3 Medications • 90 Days supply</span>
                  <span>Jun 02, 2024</span>
                </div>
              </div>

              {/* Record 5: Inpatient Discharge Summary */}
              <div 
                onClick={() => setSelectedRecord('discharge')}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  background: selectedRecord === 'discharge' ? '#eff6ff' : '#ffffff',
                  borderLeft: selectedRecord === 'discharge' ? '4px solid #0a4bb5' : '4px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
                    Inpatient Discharge Summary - Ward 4B
                  </div>
                  <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                    Archived
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                  City General Hospital • Admission: May 12 - May 18, 2024
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <span>Primary Diagnosis: Acute Coronary Syndrome</span>
                  <span>May 18, 2024</span>
                </div>
              </div>

            </div>

            {/* Pagination footer */}
            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: '#64748b' }}>
              <span>Showing 5 of 58 unified records</span>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>&lt;</button>
                <span style={{ fontWeight: '800', color: '#0a4bb5' }}>1</span>
                <button style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>&gt;</button>
              </div>
            </div>
          </div>

          {/* RIGHT: Document Inspector & Synthesizer */}
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            
            {/* Inspector Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Comprehensive Metabolic & Lipid Profile (Oct 20, 2024)
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>Verified Digital Record • National Diagnostic Interoperability Standard</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => showToast('Displaying FHIR Observation JSON schema')}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                >
                  &lt;&gt; FHIR JSON
                </button>
                <button 
                  onClick={() => showToast('Downloading authentic signed PDF lab report')}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                >
                  <Download size={13} /> Download PDF
                </button>
                <button 
                  onClick={() => showToast('Cryptographic signature verified: Valid')}
                  style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#166534', cursor: 'pointer' }}
                >
                  ✓ Verify Signature
                </button>
                <button 
                  onClick={() => showToast('ABDM Consent active: Granted by Rahul Sharma')}
                  style={{ background: '#0a4bb5', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
                >
                  ABDM Consent
                </button>
              </div>
            </div>

            {/* Specimen Metadata Table */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', display: 'block' }}>SPECIMEN SOURCE</span>
                <strong style={{ fontSize: '12px', color: '#1e293b' }}>Venous Blood (Fasting 12h)</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', display: 'block' }}>COLLECTION TIMESTAMP</span>
                <strong style={{ fontSize: '12px', color: '#1e293b' }}>20-Oct-2024 - 07:45 AM</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', display: 'block' }}>LABORATORY REF</span>
                <strong style={{ fontSize: '12px', color: '#1e293b' }}>TC-BLR-883918</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', display: 'block' }}>INTERPRETED STATUS</span>
                <strong style={{ fontSize: '12px', color: '#dc2626' }}>⚠ Critical Hyperlipidemia</strong>
              </div>
            </div>

            {/* Diagnostic Parameters Table */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a' }}>
                  Structured Diagnostic Parameters (FHIR Observation Extracted)
                </span>
                <span style={{ fontSize: '10.5px', color: '#64748b' }}>Auto-Normalized via LOINC</span>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                
                {/* Total Cholesterol */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Total Cholesterol</strong>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>LOINC 2093-3</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>242 <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>mg/dL</span></span>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10.5px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>High [Ref: &lt;200]</span>
                    <span style={{ color: '#dc2626' }}>↗</span>
                  </div>
                </div>

                {/* LDL Cholesterol */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', background: '#fff5f5' }}>
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#dc2626' }}>LDL Cholesterol (Direct)</strong>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>LOINC 13457-7</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626' }}>164 <span style={{ fontSize: '11px', fontWeight: 'normal' }}>mg/dL</span></span>
                    <span style={{ background: '#b91c1c', color: '#ffffff', fontSize: '10.5px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>Critical [Ref: &lt;100]</span>
                    <AlertCircle size={15} color="#dc2626" />
                  </div>
                </div>

                {/* HDL Cholesterol */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>HDL Cholesterol</strong>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>LOINC 2085-9</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>44 <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>mg/dL</span></span>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10.5px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>Normal [Ref: &gt;40]</span>
                    <CheckCircle2 size={15} color="#16a34a" />
                  </div>
                </div>

                {/* Triglycerides */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Triglycerides</strong>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>LOINC 2571-8</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>170 <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>mg/dL</span></span>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '10.5px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>Borderline [Ref: &lt;150]</span>
                    <span>—</span>
                  </div>
                </div>

                {/* Fasting Blood Glucose */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px' }}>
                  <div>
                    <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Fasting Blood Glucose</strong>
                    <span style={{ fontSize: '10.5px', color: '#94a3b8', marginLeft: '6px' }}>LOINC 1558-6</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>98 <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>mg/dL</span></span>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10.5px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>Optimal [Ref: 70-99]</span>
                    <CheckCircle2 size={15} color="#16a34a" />
                  </div>
                </div>

              </div>
            </div>

            {/* Longitudinal Trend Chart (2022 — 2024) */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>MediMind Longitudinal Trend & Clinical Synthesizer</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Cross-Document Parameter Modeling (2022 — 2024)</span>
                </div>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                  18% Net Improvement
                </span>
              </div>

              <div style={{ height: '150px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={longitudinalTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[30, 300]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" name="Total Cholesterol" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="ldl" name="LDL Direct" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="hdl" name="HDL Baseline" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '11px', color: '#475569', marginTop: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#2563eb', borderRadius: '50%' }}></span> Total Cholesterol</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }}></span> LDL Target & Trend</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '8px', background: '#16a34a', borderRadius: '50%' }}></span> HDL Baseline</span>
              </div>
            </div>

            {/* AI Clinical Copilot Synthesis & Prognosis */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '13px', fontWeight: '800', marginBottom: '6px' }}>
                <Sparkles size={16} /> AI Clinical Copilot Synthesis & Prognosis
              </div>
              <p style={{ fontSize: '12px', color: '#14532d', lineHeight: '1.5', margin: 0 }}>
                "Dyslipidemia showing gradual stabilization on <strong>Atorvastatin 20mg daily</strong>. LDL has decreased from baseline 208 mg/dL (May 2022) to 164 mg/dL (-21.1%), but remains outside target threshold (&lt;100 mg/dL for cardiac risk profile). <strong>Recommendation:</strong> Escalate to Atorvastatin 40mg or add Ezetimibe 10mg. Order Comprehensive Liver Function Panel (LFT) and hs-CRP at next 6-month interval."
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #dcfce7', fontSize: '11.5px' }}>
                <span style={{ color: '#166534', fontWeight: '700' }}>Confidence Score: 96.4% based on ACC/AHA 2023 Guidelines</span>
                <button 
                  onClick={() => showToast('AI Synthesis added to Dr. Sarah Chen consultation notes.')}
                  style={{ background: '#16a34a', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Add to Doctor Consultation Notes
                </button>
              </div>
            </div>

            {/* ABDM Consent Artifact & Audit Trail */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
                  <ShieldCheck size={14} color="#0a4bb5" /> ABDM Consent Artifact & Audit Trail
                </div>
                <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700' }}>HIPAA & ABDM Compliant</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: '10.5px', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
                <div>
                  <span style={{ display: 'block', fontWeight: '700' }}>CONSENT ARTIFACT ID</span>
                  <span>#CONSENT-2024-99128</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontWeight: '700' }}>VALIDITY WINDOW</span>
                  <span>Active until 31-Dec-2025</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontWeight: '700' }}>DATA CUSTODIAN</span>
                  <span>National Health Authority (NHA)</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '10.5px', color: '#94a3b8' }}>
                <span>🔒 Digest: 4c096b21f98d... (Encrypted via Ayushman Bharat Health Stack)</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ color: '#0a4bb5', cursor: 'pointer' }}>Audit Access Log (12 Events)</span>
                  <span style={{ color: '#dc2626', cursor: 'pointer' }}>Revoke Patient Consent</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
