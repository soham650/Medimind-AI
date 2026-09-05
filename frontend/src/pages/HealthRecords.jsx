import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Bell, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Share2, 
  Calendar, 
  CheckCircle2, 
  UploadCloud, 
  Plus, 
  ChevronRight, 
  User, 
  Lock, 
  ExternalLink, 
  Eye, 
  RefreshCw,
  QrCode,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { abdmService } from '../services/abdm.service';

export default function HealthRecords() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [selectedMember, setSelectedMember] = useState('rahul');
  const [toastMessage, setToastMessage] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [consents, setConsents] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadAbdmData() {
      setLoading(true);
      try {
        const [members, activeConsents, logs] = await Promise.all([
          abdmService.getFamilyDependents(user?.id),
          abdmService.getAbdmConsents(),
          abdmService.getAuditLogs()
        ]);
        if (members && members.length > 0) setFamilyMembers(members);
        if (activeConsents) setConsents(activeConsents);
        if (logs) setAuditLogs(logs);
      } catch (err) {
        console.warn('Failed to load ABDM data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAbdmData();
  }, [user]);

  const handleConsentAction = async (consentId, action) => {
    showToast(`Processing consent ${action}...`);
    try {
      const res = await abdmService.processConsent(consentId, action);
      if (res?.success) {
        showToast(`Consent ${action === 'grant' ? 'approved (30-day view access granted)' : action === 'deny' ? 'denied' : 'revoked'}. Audit hash: ${res.audit_hash}`);
        setConsents(prev => prev.map(c => c.id === consentId ? { ...c, status: action === 'grant' ? 'granted' : 'denied' } : c));
      }
    } catch (err) {
      showToast(`Consent update notice: ${err.message}`);
    }
  };


  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Patient Header Bar */}
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
        <div style={{ position: 'relative', flex: 1, maxWidth: '520px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search lab tests, medication ⌘K"
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
        </div>

        {/* Right Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
            ABHA Linked: Active
          </span>

          <button 
            onClick={() => showToast('🚨 Calling 108 Emergency Ambulance Network...')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: '800',
              padding: '7px 14px',
              borderRadius: '9999px',
              cursor: 'pointer'
            }}
          >
            <span>☢</span> CALL SOS / 108
          </button>

          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={20} color="#475569" />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }}></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
              RS
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Rahul Sharma (32Y)</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>ABHA: 91-2345-6789-0123</div>
            </div>
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
        
        {/* Page Title and Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                ABDM M3 Certified Locker
              </span>
              <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                🛡 256-Bit Military Grade Encryption
              </span>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                ● Live Gateway Connected
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              ABHA Health Locker & Family Vault
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Unified Government of India Ayushman Bharat Digital Mission (ABDM) PHR records vault. Securely manage, store, consent, and share longitudinal health documents for your entire family.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => showToast('Linking new hospital discovery bridge...')}
              style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LinkIcon size={14} /> Link New Hospital / Clinic
            </button>
            <button 
              onClick={() => showToast('Add dependent / family member modal opened')}
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: '700', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <User size={14} /> Add Family Member
            </button>
            <button 
              onClick={() => showToast('Downloading Official ABHA PDF Card')}
              style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: '600', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Download size={14} /> Download ABHA Card
            </button>
          </div>
        </div>

        {/* 3 Identity Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>ABHA NUMBER</span>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>91-2345-6789-0123 <CheckCircle2 size={14} color="#16a34a" style={{ display: 'inline', verticalAlign: 'middle' }} /></div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>ABHA ADDRESS</span>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>rahul.sharma@abdm</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>HEALTH REPOSITORY STATUS</span>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#16a34a' }}>100% Synced (3 Facilities)</div>
            </div>
          </div>
        </div>

        {/* Family Health Vault Switcher */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>FAMILY HEALTH VAULT SWITCHER</strong>
              <span style={{ background: '#eff6ff', color: '#0a4bb5', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>4 Dependents Linked</span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#0a4bb5', fontWeight: '700', cursor: 'pointer' }}>Manage Family Permissions →</span>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px' }}>
            
            {/* Rahul */}
            <div 
              onClick={() => setSelectedMember('rahul')}
              style={{
                border: selectedMember === 'rahul' ? '2px solid #0a4bb5' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px',
                background: selectedMember === 'rahul' ? '#eff6ff' : '#ffffff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                  RS
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Rahul Sharma</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Self • 32Y • O+</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                Records: <strong>58 Docs</strong> • Connected: <strong>3 Hospitals</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                <span style={{ color: '#16a34a', fontWeight: '700' }}>● ABHA Active</span>
                <span style={{ color: '#0a4bb5', fontWeight: '800' }}>Current View</span>
              </div>
            </div>

            {/* Pooja */}
            <div 
              onClick={() => setSelectedMember('pooja')}
              style={{
                border: selectedMember === 'pooja' ? '2px solid #0a4bb5' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px',
                background: selectedMember === 'pooja' ? '#eff6ff' : '#ffffff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#9333ea', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                  PS
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Pooja Sharma</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Spouse • 30Y • B+</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                Records: <strong>24 Docs</strong> • Connected: <strong>2 Hospitals</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                <span style={{ color: '#16a34a', fontWeight: '700' }}>● Linked</span>
                <span style={{ color: '#64748b' }}>Switch</span>
              </div>
            </div>

            {/* Aarav */}
            <div 
              onClick={() => setSelectedMember('aarav')}
              style={{
                border: selectedMember === 'aarav' ? '2px solid #0a4bb5' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px',
                background: selectedMember === 'aarav' ? '#eff6ff' : '#ffffff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                  AS
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Aarav Sharma</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Child • 5Y • O+</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                Vaccinations: <strong>12 Recorded</strong> • Ped: Dr. Sen
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                <span style={{ color: '#16a34a', fontWeight: '700' }}>● Dependent</span>
                <span style={{ color: '#64748b' }}>Switch</span>
              </div>
            </div>

            {/* Satish */}
            <div 
              onClick={() => setSelectedMember('satish')}
              style={{
                border: selectedMember === 'satish' ? '2px solid #0a4bb5' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px',
                background: selectedMember === 'satish' ? '#eff6ff' : '#ffffff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ea580c', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                  SS
                </div>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Satish Sharma</strong>
                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>Father • 68Y • Senior</span>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                Chronic Records: <strong>42 Cardio Rx</strong> • Full Proxy
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                <span style={{ color: '#ea580c', fontWeight: '700' }}>● Monitoring</span>
                <span style={{ color: '#64748b' }}>Switch</span>
              </div>
            </div>

            {/* Add Dependent Card */}
            <div 
              onClick={() => showToast('Opening Instant Dependent ABHA Creation wizard')}
              style={{
                border: '1px dashed #cbd5e1',
                borderRadius: '10px',
                padding: '12px',
                background: '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                <Plus size={18} />
              </div>
              <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Add Dependent</strong>
              <span style={{ fontSize: '10.5px', color: '#64748b' }}>Instant child or elder ABHA creation</span>
            </div>

          </div>
        </div>

        {/* 2-Column Main Workspace: Longitudinal Clinical Records (Left) vs ABHA Card & Consent Manager (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Records & Filters & Upload OCR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Filter Search Bar & Tabs */}
            <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text"
                    placeholder="Filter by Doctor, Diagnostic lab, Hospital, or ICD..."
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select style={{ border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '11.5px', color: '#334155', background: '#f8fafc', outline: 'none' }}>
                    <option>Past 12 Months</option>
                    <option>All Time</option>
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'all', label: 'All Documents (58)' },
                  { id: 'prescriptions', label: 'Prescriptions (18)' },
                  { id: 'labs', label: 'Lab Reports (22)' },
                  { id: 'discharge', label: 'Discharge Summaries (8)' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: activeTab === tab.id ? '#0a4bb5' : '#ffffff',
                      color: activeTab === tab.id ? '#ffffff' : '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Longitudinal Records List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Record 1: Inpatient Discharge Summary */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Inpatient Discharge Summary</span>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Digitally Signed FHIR</span>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>HIPAA Verified</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => showToast('Displaying Inpatient Discharge PDF')}
                      style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      View PDF
                    </button>
                    <button 
                      onClick={() => showToast('Displaying FHIR JSON bundle')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                    >
                      &lt;&gt; FHIR JSON
                    </button>
                    <button 
                      onClick={() => showToast('Share token generated')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                    >
                      Share
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                  Apollo Hospitals - Acute Cardiac Evaluation & Observation
                </h3>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>
                  Oct 20, 2024 • Dr. Sarah Chen, MD (Cardiology) • Hospital ID: PAP-99214
                </div>
                <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: '1.4' }}>
                  <strong>Diagnosis:</strong> Non-ST segment elevation myocardial event ruled out. Transient arrhythmia controlled with Beta-blockers. Follow-up 24h Holter requested.
                </p>
              </div>

              {/* Record 2: Diagnostic Lab Report */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ background: '#eff6ff', color: '#0a4bb5', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Diagnostic Lab Report</span>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>High LDL Flagged</span>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Verified by Pathologist</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => showToast('Opening Structured Observation metrics')}
                      style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Structured Data
                    </button>
                    <button 
                      onClick={() => showToast('Share token generated')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                    >
                      Share
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                  Thyrocare Technologies - Comprehensive Lipid & Metabolic Panel
                </h3>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '10px' }}>
                  Oct 18, 2024 • Sample Ref: #TC-LIP-44021
                </div>

                {/* Vitals Summary Pill Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Total Cholesterol</span>
                    <strong style={{ fontSize: '13px', color: '#dc2626' }}>242 mg/dL</strong>
                    <span style={{ fontSize: '10px', color: '#dc2626', marginLeft: '4px' }}>High</span>
                  </div>
                  <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px 10px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>LDL (Bad Cholesterol)</span>
                    <strong style={{ fontSize: '13px', color: '#dc2626' }}>164 mg/dL</strong>
                    <span style={{ fontSize: '10px', color: '#dc2626', marginLeft: '4px' }}>+24</span>
                  </div>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 10px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>HDL (Good)</span>
                    <strong style={{ fontSize: '13px', color: '#16a34a' }}>48 mg/dL</strong>
                    <span style={{ fontSize: '10px', color: '#16a34a', marginLeft: '4px' }}>Normal</span>
                  </div>
                </div>
              </div>

              {/* Record 3: OPD e-Prescription */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>OPD e-Prescription</span>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Active Course</span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => showToast('Opening digital Rx view')}
                      style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      View Rx
                    </button>
                    <button 
                      onClick={() => showToast('Refill request dispatched to Apollo Pharmacy')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                    >
                      Refill
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                  Max Super Speciality - OPD Consultation & Prescription
                </h3>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>
                  Jun 02, 2024 • Dr. Arjun Mehta, MD (Internal Medicine)
                </div>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px' }}>
                  <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>Atorvastatin 10mg (OD, Night)</span>
                  <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>Metoprolol Succinate 25mg (OD)</span>
                </div>
              </div>

              {/* Record 4: Child Immunization Record */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Child Immunization Record</span>
                    <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Official Seal PDF</span>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Government Digital Seal</span>
                  </div>

                  <button 
                    onClick={() => showToast('Official Government Seal PDF verified: Valid')}
                    style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Official Seal PDF
                  </button>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 2px 0' }}>
                  Universal Child Immunization Card & Digital Certificate
                </h3>
                <span style={{ fontSize: '11px', color: '#166534', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  Aarav Sharma (Dependent)
                </span>
                <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: '1.4' }}>
                  Full pediatric vaccine schedule completed: MMR booster, DTP 2nd booster, Oral Polio (OPV), Hepatitis B series. Verified via CoWIN/U-WIN national registry sync.
                </p>
                <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', marginTop: '6px' }}>
                  ✓ Next scheduled dose: Typhoid Conjugate Vaccine at age 6Y (Nov 2025)
                </div>
              </div>

            </div>

            {/* Upload & Digitize Physical Paper Records */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Upload & Digitize Physical Paper Records
                </h3>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                  AI OCR Enabled
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                Upload handwritten prescriptions, old discharge summaries, or physical lab slips. MediMind AI OCR will auto-extract diagnostic metrics into structured FHIR records and link them directly to your ABHA vault.
              </p>

              <div 
                onClick={() => showToast('Opening file selector for ABHA record ingestion')}
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '24px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}
              >
                <UploadCloud size={30} color="#0a4bb5" style={{ margin: '0 auto 8px auto' }} />
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                  Drag and drop physical medical files here, or <span style={{ color: '#0a4bb5' }}>browse files</span>
                </strong>
                <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                  Supports high-resolution camera photos, Scanned PDF, JPEG, PNG (Up to 25MB). Auto-anonymized & ABDM compliant.
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: ABHA Digital Health ID Card & Consent Manager */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* ABHA Digital Health ID Card */}
            <div style={{
              background: 'linear-gradient(135deg, #0a4bb5 0%, #1e3a8a 100%)',
              borderRadius: '14px',
              padding: '20px',
              color: '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(10, 75, 181, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.06em', color: '#bfdbfe' }}>
                    NATIONAL HEALTH AUTHORITY
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: '900' }}>Ayushman Bharat Digital Mission</div>
                </div>
                <div style={{ background: '#ffffff', padding: '4px', borderRadius: '6px' }}>
                  <QrCode size={36} color="#0f172a" />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ffffff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '18px' }}>
                  RS
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Rahul Sharma</h4>
                  <div style={{ fontSize: '11px', color: '#dbeafe' }}>DOB: 14/09/1992 (32Y) • Male • Blood: O+</div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div>
                  <span style={{ fontSize: '9.5px', color: '#bfdbfe', display: 'block' }}>ABHA NUMBER</span>
                  <strong>91-2345-6789-0123</strong>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '9.5px', color: '#bfdbfe', display: 'block' }}>ABHA ADDRESS</span>
                  <strong>rahul.sharma@abdm</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button 
                  onClick={() => showToast('Downloading authentic official ABHA PDF card')}
                  style={{ flex: 1, background: '#ffffff', color: '#0a4bb5', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer' }}
                >
                  Download Card (PDF)
                </button>
                <button 
                  onClick={() => showToast('ABHA Digital Pass added to Apple/Google Wallet')}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '8px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Add to Wallet
                </button>
              </div>
            </div>

            {/* ABDM Consent & Access Manager */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="#0a4bb5" />
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    ABDM Consent & Access Manager
                  </h3>
                </div>
                <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                  1 Pending
                </span>
              </div>

              {/* Pending Request Card */}
              <div style={{ border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#1e40af' }}>CONSENT REQUEST</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Oct 20, 2024</span>
                </div>
                <strong style={{ fontSize: '12.5px', color: '#0f172a', display: 'block' }}>
                  Dr. Sarah Chen (City Heart Institute)
                </strong>
                <p style={{ fontSize: '11px', color: '#334155', margin: '4px 0 10px 0', lineHeight: '1.4' }}>
                  Requested 30-day view access for: <strong>Lipid Profiles & ECG Records</strong> for upcoming tele-consultation.
                </p>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleConsentAction(consents[0]?.id || 'c1', 'grant')}
                    style={{ flex: 1, background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Approve Access
                  </button>
                  <button 
                    onClick={() => handleConsentAction(consents[0]?.id || 'c1', 'deny')}
                    style={{ flex: 1, background: '#ffffff', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Deny / Restrict
                  </button>
                </div>
              </div>

              {/* Active Shared Consents List */}
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  ACTIVE SHARED CONSENTS
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Max Healthcare Ambulatory</strong>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Active until Nov 15, 2024</span>
                    </div>
                    <button 
                      onClick={() => handleConsentAction('c2', 'revoke')}
                      style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Revoke
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Thyrocare Home Diagnostics</strong>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>One-time fetch (Completed)</span>
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>Expired</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ABDM Access Audit Log */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Lock size={15} color="#16a34a" />
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>ABDM ACCESS AUDIT LOG</strong>
              </div>

              <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: '1.4', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                Last record accessed by <strong>Dr. Sarah Chen</strong> on <strong>Oct 21, 2024 at 10:15 AM IST</strong> via ABDM Gateway.
                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                  Audit Hash: #0x9F42...88CA
                </div>
              </div>

              <span 
                onClick={() => showToast('Loading 14 historical audit events from ABDM Gateway...')}
                style={{ fontSize: '11px', fontWeight: '700', color: '#0a4bb5', display: 'block', marginTop: '10px', cursor: 'pointer' }}
              >
                View Complete Audit Trail (14 Events) →
              </span>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          marginTop: '32px',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div>
            © 2025 MediMind AI Healthcare. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#16a34a" /> ABDM M3 Certified
            </span>
            <span>HIPAA & ISO 27001 Compliant</span>
            <span>Security Audits Passed</span>
            <span>Emergency Contacts</span>
          </div>
        </div>

      </div>
    </div>
  );
}
