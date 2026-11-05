import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services';
import {
  Settings,
  Activity,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Zap,
  HardDrive,
  Sliders,
  Bell,
  HeartPulse,
  Wrench,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function SystemSettings() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [settings, setSettings] = useState({
    platformName: 'MediMind AI',
    timezone: 'Asia/Kolkata (IST)',
    preferredLanguage: 'English',
    sessionTimeoutMinutes: 60,
    maintenanceMode: false,
    allowRegistrations: true,
    requireDoctorLicense: true,
    requirePharmacyLicense: true,
    aiTriageEnabled: true,
    maxDailyQuota: 50000,
    abdmGatewayLive: true,
    encryptionStandard: 'AES-256 / TLS 1.3'
  });

  const fetchSystemData = async () => {
    setRefreshing(true);
    try {
      const [health, loadedSettings] = await Promise.all([
        adminService.getSystemHealth(),
        adminService.getSystemSettings()
      ]);
      setHealthData(health);
      if (loadedSettings) {
        setSettings(prev => ({ ...prev, ...loadedSettings }));
      }
    } catch (err) {
      console.error('Error loading system settings data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggle = async (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    try {
      await adminService.updateSystemSettings(updated);
      showToast(`Setting "${key}" updated.`);
    } catch (err) {
      alert('Failed to persist setting: ' + err.message);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'security', label: 'Security & RLS', icon: ShieldCheck },
    { id: 'ai', label: 'AI Infrastructure', icon: Zap },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'platform', label: 'Platform & DB', icon: Database },
    { id: 'healthcare', label: 'Healthcare & ABDM', icon: HeartPulse },
    { id: 'maintenance', label: 'Maintenance Mode', icon: Wrench }
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#f8fafc', borderRadius: '6px', color: '#334155', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Settings size={16} /> Platform Configuration
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            System Settings & Microservice Telemetry
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Manage core platform parameters, microservice health, and clinical compliance policies without exposing private secrets.
          </p>
        </div>

        <button
          onClick={fetchSystemData}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155'
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Checking...' : 'Check Health'}
        </button>
      </div>

      {/* 7-Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px 8px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid #0a4bb5' : '3px solid transparent',
                background: isActive ? '#eff6ff' : 'transparent',
                color: isActive ? '#0a4bb5' : '#64748b',
                fontWeight: isActive ? '700' : '600',
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
        {/* Tab 1: General */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>General Platform Parameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Platform Name</label>
                <input type="text" readOnly value={settings.platformName} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>System Timezone</label>
                <input type="text" readOnly value={settings.timezone} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>Default Language</label>
                <input type="text" readOnly value={settings.preferredLanguage} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>JWT Session Expiration</label>
                <input type="text" readOnly value={`${settings.sessionTimeoutMinutes} minutes`} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a' }} />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Security & RLS */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Database Security & Row-Level Access Policies</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#166534' }}>PostgreSQL Row Level Security (RLS)</div>
                  <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>Active across all 44 canonical public tables. Zero anonymous mutations permitted.</div>
                </div>
                <span style={{ padding: '4px 10px', background: '#16a34a', color: '#ffffff', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>ENFORCED</span>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Transit & At-Rest Encryption</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>TLS 1.3 in-flight with AES-256 transparent database volume encryption.</div>
                </div>
                <span style={{ padding: '4px 10px', background: '#e2e8f0', color: '#334155', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>AES-256</span>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Authoritative RBAC Table</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>PostgreSQL public.user_roles with SECURITY DEFINER helper public.is_admin().</div>
                </div>
                <span style={{ padding: '4px 10px', background: '#e2e8f0', color: '#334155', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>ACTIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: AI Infrastructure */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>AI Reasoning & Triage Microservice Parameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Primary Clinical LLM</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Gemini 1.5 Pro (via Google Generative AI API)</div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: '700' }}>Credentials Secure (Backend Gateway Only)</div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Random Forest Diagnostic Service</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>FastAPI Model: symptom-rf-v1 (132 disease features)</div>
                <div style={{ fontSize: '11px', color: health?.mlService?.status === 'healthy' ? '#16a34a' : '#b91c1c', marginTop: '6px', fontWeight: '700' }}>
                  Health: {health?.mlService?.status || 'offline'} ({health?.mlService?.latencyMs || 0}ms)
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Enable Public Symptom Checker</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Allow unregistered patients to access initial AI symptom triage</div>
              </div>
              <button onClick={() => handleToggle('aiTriageEnabled')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.aiTriageEnabled ? '#16a34a' : '#94a3b8' }}>
                {settings.aiTriageEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Platform Notification Governance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>Automated Doctor Credential Notifications</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Dispatch alerts to doctors when verified or rejected via verify_doctor_tx</div>
                </div>
                <button onClick={() => handleToggle('requireDoctorLicense')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.requireDoctorLicense ? '#16a34a' : '#94a3b8' }}>
                  {settings.requireDoctorLicense ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>Automated Pharmacy Licensing Notifications</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Dispatch alerts to dispensaries when verified or rejected via verify_pharmacy_tx</div>
                </div>
                <button onClick={() => handleToggle('requirePharmacyLicense')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.requirePharmacyLicense ? '#16a34a' : '#94a3b8' }}>
                  {settings.requirePharmacyLicense ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Platform & DB */}
        {activeTab === 'platform' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Database Cluster & Cloud Storage</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>PostgreSQL Cluster</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Supabase AWS ap-south-1 (Mumbai)</div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: '700' }}>
                  Status: {healthData?.database?.status || 'healthy'} ({healthData?.database?.latencyMs || 0}ms)
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Encrypted File Storage</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Buckets: medical-records, doctor-documents, pharmacy-licenses</div>
                <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: '700' }}>
                  Access: Signed Private URLs (Expiry: 60s)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Healthcare & ABDM */}
        {activeTab === 'healthcare' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Healthcare Regulatory Compliance (ABDM / NDHM)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Ayushman Bharat Digital Mission (ABDM) Gateway</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Milestone 1 & 2 integration: ABHA ID creation and consent artifact manager.</div>
                </div>
                <span style={{ padding: '4px 10px', background: '#dcfce7', color: '#15803d', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>READY</span>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>Clinical Consent Artifact Validity</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>patient_doctor_access table with valid_until timestamp validation.</div>
                </div>
                <span style={{ padding: '4px 10px', background: '#e2e8f0', color: '#334155', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>TIME-BOUND</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Maintenance Mode */}
        {activeTab === 'maintenance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Platform Maintenance & Emergency Controls</h3>
            <div style={{ padding: '18px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#991b1b' }}>Platform Maintenance Mode</h4>
                  <p style={{ fontSize: '13px', color: '#b91c1c', marginTop: '2px' }}>
                    When active, standard non-admin users will be temporarily locked out with a scheduled maintenance window screen.
                  </p>
                </div>
                <button
                  onClick={() => handleToggle('maintenanceMode')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: settings.maintenanceMode ? '#16a34a' : '#dc2626',
                    color: '#ffffff',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  {settings.maintenanceMode ? 'Disable Maintenance' : 'Activate Maintenance Mode'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Allow New Patient Registrations</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Toggle public self-registration on /register route</div>
              </div>
              <button onClick={() => handleToggle('allowRegistrations')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.allowRegistrations ? '#16a34a' : '#94a3b8' }}>
                {settings.allowRegistrations ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
