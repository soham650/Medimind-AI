import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services';
import { Link } from 'react-router-dom';
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Clock,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  RefreshCw,
  FolderOpen,
  FileCheck
} from 'lucide-react';

export default function PatientSettings() {
  const { user, profile, isAuthenticated, loginDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [error, setError] = useState(null);

  // Settings State mapped directly to schema fields
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  // Client-side notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    appointmentReminders: true,
    prescriptionRefills: true,
    orderUpdates: true,
    clinicalTriageAlerts: true
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadSettings() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const patientData = await patientService.getProfile(user.id);
        if (patientData) {
          if (patientData.preferred_language) setPreferredLanguage(patientData.preferred_language);
          if (patientData.timezone) setTimezone(patientData.timezone);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user?.id]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      alert('You must be signed in to save settings.');
      return;
    }

    setSaving(true);
    try {
      await patientService.updateSettings(user.id, {
        preferred_language: preferredLanguage,
        timezone
      });
      showToast('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated && !loading) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: '580px', margin: '0 auto', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Sign In to Manage Settings</h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
          Configure your language, notification preferences, and healthcare privacy controls.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
          <Link to="/login" style={{ background: '#0a4bb5', color: '#ffffff', padding: '12px 24px', borderRadius: '10px', fontWeight: '700', textDecoration: 'none' }}>
            Sign In
          </Link>
          <button onClick={() => loginDemo('patient')} style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '12px 20px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
            1-Click Demo Sign In
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Loading Settings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '800', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Settings size={16} /> Patient Account Settings
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px', margin: 0 }}>
          Preferences &amp; Healthcare Privacy
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>
          Manage your localization preferences, notification channels, and ABDM data sharing controls.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Section 1: Localization */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <Globe size={20} color="#0a4bb5" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Language &amp; Region</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Configure clinical report and UI localization.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Preferred Language
              </label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#ffffff' }}
              >
                <option value="English">English</option>
                <option value="Hindi">हिंदी (Hindi)</option>
                <option value="Bengali">বাংলা (Bengali)</option>
                <option value="Telugu">తెలుగు (Telugu)</option>
                <option value="Marathi">मराठी (Marathi)</option>
                <option value="Tamil">தமிழ் (Tamil)</option>
                <option value="Gujarati">ગુજરાતી (Gujarati)</option>
                <option value="Kannada">ಕನ್ನಡ (Kannada)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#ffffff' }}
              >
                <option value="Asia/Kolkata">India Standard Time (IST - Asia/Kolkata)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
                <option value="America/New_York">Eastern Time (US &amp; Canada)</option>
                <option value="Europe/London">Greenwich Mean Time (GMT / BST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <Bell size={20} color="#0a4bb5" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Notification Channels</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Configure clinical reminders and updates.</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>Appointment Reminders</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Receive alerts 2 hours and 15 minutes before scheduled teleconsultations.</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.appointmentReminders}
                onChange={(e) => setNotifPrefs(prev => ({ ...prev, appointmentReminders: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#0a4bb5' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0', borderTop: '1px solid #f8fafc' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>Prescription Refill Alerts</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Get notified when your active medicine dose supply drops below 5 days.</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.prescriptionRefills}
                onChange={(e) => setNotifPrefs(prev => ({ ...prev, prescriptionRefills: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#0a4bb5' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0', borderTop: '1px solid #f8fafc' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>Medicine Order Progression</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Real-time updates when pharmacy confirms, packs, and dispatches your order.</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.orderUpdates}
                onChange={(e) => setNotifPrefs(prev => ({ ...prev, orderUpdates: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#0a4bb5' }}
              />
            </label>

            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '8px 0', borderTop: '1px solid #f8fafc' }}>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>AI Clinical Findings Notifications</strong>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0 0' }}>Alerts when laboratory reports finish automated multimodal extraction.</p>
              </div>
              <input
                type="checkbox"
                checked={notifPrefs.clinicalTriageAlerts}
                onChange={(e) => setNotifPrefs(prev => ({ ...prev, clinicalTriageAlerts: e.target.checked }))}
                style={{ width: '18px', height: '18px', accentColor: '#0a4bb5' }}
              />
            </label>
          </div>
        </div>

        {/* Section 3: Healthcare Privacy & ABDM */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
            <Shield size={20} color="#16a34a" />
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Privacy &amp; Data Governance</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Zero-trust patient isolation and ABDM 3.0 standards.</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '14px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: '700', fontSize: '13.5px' }}>
                <CheckCircle2 size={16} /> Row-Level Security (RLS) Active
              </div>
              <p style={{ fontSize: '12px', color: '#166534', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                Your medical records, symptom assessments, lab documents, and prescriptions are strictly isolated to your authenticated account. No other patient or unauthorized doctor can view your clinical data.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>ABDM Health Locker &amp; Consent Bridge</strong>
                <p style={{ fontSize: '11.5px', color: '#64748b', margin: '2px 0 0 0' }}>Manage practitioner consent requests and family member lockers.</p>
              </div>
              <Link to="/records" style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>
                Open Health Records →
              </Link>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              background: '#0a4bb5',
              color: '#ffffff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '10px',
              fontWeight: '800',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(10, 75, 181, 0.25)',
              opacity: saving ? 0.7 : 1
            }}
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{saving ? 'Saving Preferences...' : 'Save Settings'}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
