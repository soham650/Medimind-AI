import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Heart,
  Shield,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  Camera,
  Save,
  RefreshCw,
  AlertCircle,
  QrCode,
  Activity,
  FileBadge
} from 'lucide-react';

export default function PatientProfile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'O+',
    emergency_contact: '',
    address: '',
    abha_id: '',
    preferred_language: 'English',
    bp_systolic: 120,
    bp_diastolic: 80,
    blood_sugar: 100,
    bmi: 22.0,
    is_smoker: false
  });

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Allergies state
  const [allergies, setAllergies] = useState([]);
  const [newAllergen, setNewAllergen] = useState('');
  const [newSeverity, setNewSeverity] = useState('Moderate');
  const [newReaction, setNewReaction] = useState('');
  const [addingAllergy, setAddingAllergy] = useState(false);

  const fetchProfileData = async () => {
    if (!user && !profile) {
      setLoading(false);
      return;
    }
    const patientId = profile?.id || user?.id;
    setLoading(true);
    setError(null);
    try {
      const [pData, aData] = await Promise.all([
        patientService.getProfile(patientId),
        patientService.getAllergies(patientId)
      ]);

      if (pData) {
        setFormData({
          full_name: pData.full_name || profile?.full_name || '',
          phone: pData.phone || '',
          date_of_birth: pData.date_of_birth || '',
          gender: pData.gender || 'Male',
          blood_group: pData.blood_group || 'O+',
          emergency_contact: pData.emergency_contact || '',
          address: pData.address || '',
          abha_id: pData.abha_id || profile?.abha_id || '',
          preferred_language: pData.preferred_language || 'English',
          bp_systolic: pData.bp_systolic || 120,
          bp_diastolic: pData.bp_diastolic || 80,
          blood_sugar: pData.blood_sugar || 100,
          bmi: pData.bmi || 22.0,
          is_smoker: pData.is_smoker || false
        });
      }
      setAllergies(aData);
    } catch (err) {
      console.error('Error fetching patient profile:', err);
      setError(err.message || 'Unable to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user, profile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const patientId = profile?.id || user?.id;
    if (!formData.full_name.trim()) {
      alert('Full Name is required.');
      return;
    }

    setSaving(true);
    try {
      await patientService.updateProfile(patientId, formData);
      showToast('Profile and clinical baseline saved successfully!');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const patientId = profile?.id || user?.id;
    setUploadingAvatar(true);
    try {
      const publicUrl = await patientService.uploadAvatar(patientId, file);
      setAvatarUrl(publicUrl);
      showToast('Avatar photo updated successfully!');
    } catch (err) {
      alert('Avatar upload failed: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAddAllergy = async (e) => {
    e.preventDefault();
    if (!newAllergen.trim()) return;

    const patientId = profile?.id || user?.id;
    setAddingAllergy(true);
    try {
      const added = await patientService.addAllergy(patientId, {
        allergen: newAllergen.trim(),
        allergenType: 'Medication',
        severity: newSeverity,
        reactionNotes: newReaction.trim()
      });
      setAllergies((prev) => [added, ...prev]);
      setNewAllergen('');
      setNewReaction('');
      showToast(`Allergy to ${added.allergen} added.`);
    } catch (err) {
      alert('Failed to record allergy: ' + err.message);
    } finally {
      setAddingAllergy(false);
    }
  };

  const handleRemoveAllergy = async (allergyId) => {
    try {
      await patientService.removeAllergy(allergyId);
      setAllergies((prev) => prev.filter((a) => a.id !== allergyId));
      showToast('Allergy record removed.');
    } catch (err) {
      alert('Failed to remove allergy: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Loading Patient Profile & Health Records...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast */}
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
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: '700', fontSize: '13px' }}>
          <User size={18} /> PATIENT REGISTRY & CLINICAL SETTINGS
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
          Patient Health Profile
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Manage your personal demographics, emergency contacts, digital ABHA credentials, and registered clinical allergies.
        </p>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Demographics & Clinical Baseline Form */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Demographics */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="#0a4bb5" /> Personal Information & Demographics
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Primary Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Biological Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Residential Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, Landmark, City, Postal Code"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Vitals & Baselines */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#0a4bb5" /> Clinical Baselines & Vitals
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Blood Group
                </label>
                <select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  name="bp_systolic"
                  value={formData.bp_systolic}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Diastolic BP (mmHg)
                </label>
                <input
                  type="number"
                  name="bp_diastolic"
                  value={formData.bp_diastolic}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Fasting Blood Sugar (mg/dL)
                </label>
                <input
                  type="number"
                  name="blood_sugar"
                  value={formData.blood_sugar}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Body Mass Index (BMI)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="bmi"
                  value={formData.bmi}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  placeholder="+91 Emergency Contact"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                background: '#0a4bb5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(10, 75, 181, 0.25)'
              }}
            >
              {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>

        {/* Right Column: Avatar, Digital ABHA Card & Allergies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Avatar Card */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '96px', height: '96px', margin: '0 auto 16px auto' }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '3px solid #0a4bb5'
              }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={48} color="#0a4bb5" />
                )}
              </div>
              <label style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                background: '#0a4bb5',
                color: '#ffffff',
                padding: '6px',
                borderRadius: '50%',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
              }}>
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploadingAvatar} style={{ display: 'none' }} />
              </label>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
              {formData.full_name || 'Patient'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
              {user?.email || 'Authenticated User'}
            </p>
          </div>

          {/* Digital ABHA Card */}
          <div style={{
            background: 'linear-gradient(135deg, #0a4bb5 0%, #1e3a8a 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: '#ffffff',
            boxShadow: '0 10px 20px -5px rgba(10, 75, 181, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
                  AYUSHMAN BHARAT DIGITAL MISSION
                </span>
                <h4 style={{ fontSize: '18px', fontWeight: '800', marginTop: '2px' }}>ABHA Health Locker</h4>
              </div>
              <Shield size={24} color="#60a5fa" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase' }}>ABHA ID Number</span>
                <p style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.05em', marginTop: '2px' }}>
                  {formData.abha_id || '91-2384-2938-12'}
                </p>
                <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '8px' }}>
                  Blood: <strong>{formData.blood_group}</strong> • Gender: <strong>{formData.gender}</strong>
                </p>
              </div>
              <div style={{ background: '#ffffff', padding: '6px', borderRadius: '8px' }}>
                <QrCode size={48} color="#0f172a" />
              </div>
            </div>
          </div>

          {/* Known Allergies Registry */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#eab308" /> Known Clinical Allergies
            </h3>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {allergies.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                  No known medication or food allergies registered.
                </p>
              ) : (
                allergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{allergy.allergen}</strong>
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: allergy.severity === 'Severe' ? '#fee2e2' : '#fef3c7',
                        color: allergy.severity === 'Severe' ? '#b91c1c' : '#b45309',
                        fontWeight: '700'
                      }}>
                        {allergy.severity}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveAllergy(allergy.id)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Allergy Form */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                Register New Allergy
              </span>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Allergen (e.g. Penicillin)"
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddAllergy}
                disabled={addingAllergy || !newAllergen.trim()}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#0a4bb5',
                  cursor: 'pointer'
                }}
              >
                + Add Allergy Record
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
