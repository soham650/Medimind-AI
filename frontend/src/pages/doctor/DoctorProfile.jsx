import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services';
import {
  Stethoscope,
  ShieldCheck,
  Award,
  Building,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  RefreshCw,
  MapPin,
  Globe,
  BookOpen
} from 'lucide-react';

export default function DoctorProfile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    license_number: '',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD',
    experience_years: 10,
    clinic_name: 'MediMind Clinical Centre',
    clinic_address: '',
    bio: '',
    languages: 'English, Hindi',
    consultation_fee: 500,
    verification_status: 'pending'
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const fetchDoctorProfile = async () => {
    if (!user && !profile) {
      setLoading(false);
      return;
    }
    const doctorId = profile?.id || user?.id;
    setLoading(true);
    setError(null);
    try {
      const data = await doctorService.getDoctorProfile(doctorId);
      if (data) {
        setFormData({
          full_name: data.full_name || profile?.full_name || '',
          license_number: data.license_number || '',
          specialization: data.specialization || 'General Medicine',
          qualification: data.qualification || 'MBBS',
          experience_years: data.experience_years || 5,
          clinic_name: data.clinic_name || 'MediMind Clinical Centre',
          clinic_address: data.clinic_address || '',
          bio: data.bio || '',
          languages: Array.isArray(data.languages) ? data.languages.join(', ') : 'English, Hindi',
          consultation_fee: data.consultation_fee || 500,
          verification_status: data.verification_status || 'pending'
        });
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      setError(err.message || 'Unable to retrieve clinical profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, [user, profile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const doctorId = profile?.id || user?.id;

    if (!formData.full_name.trim() || !formData.license_number.trim()) {
      alert('Full Name and Medical License Number are required.');
      return;
    }

    setSaving(true);
    try {
      const languagesArray = formData.languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      await doctorService.updateDoctorProfile(doctorId, {
        full_name: formData.full_name,
        license_number: formData.license_number,
        specialization: formData.specialization,
        qualification: formData.qualification,
        experience_years: parseInt(formData.experience_years, 10),
        clinic_name: formData.clinic_name,
        clinic_address: formData.clinic_address,
        bio: formData.bio,
        languages: languagesArray,
        consultation_fee: parseFloat(formData.consultation_fee)
      });

      showToast('Doctor credentials & clinical profile saved successfully!');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const doctorId = profile?.id || user?.id;
    setUploadingDoc(true);
    try {
      const path = await doctorService.uploadDoctorDocument(doctorId, file, 'Medical Registration Certificate');
      setUploadedFiles((prev) => [...prev, { name: file.name, path, date: new Date().toLocaleDateString() }]);
      showToast('Registration certificate submitted for Admin verification!');
    } catch (err) {
      alert('Document upload failed: ' + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', color: '#15803d', label: 'Verified Practitioner', icon: CheckCircle2 };
      case 'rejected':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Verification Rejected', icon: AlertCircle };
      default:
        return { bg: '#fef3c7', color: '#b45309', label: 'Pending Admin Verification', icon: Clock };
    }
  };

  const badge = getStatusBadge(formData.verification_status);
  const BadgeIcon = badge.icon;

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Loading Doctor Profile & Clinical Credentials...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <Stethoscope size={18} /> PRACTITIONER CREDENTIALS & LICENSING
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Doctor Clinical Profile
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Maintain your medical license details, clinic affiliations, qualifications, and submit certificates for regulatory verification.
          </p>
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '20px',
          background: badge.bg,
          color: badge.color,
          fontSize: '13px',
          fontWeight: '700'
        }}>
          <BadgeIcon size={16} />
          {badge.label}
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Form */}
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: Professional Identification */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#0a4bb5" /> Medical Qualifications & Licensing
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Full Practitioner Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  placeholder="Dr. Full Name, MD"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Medical Council Registration No. *
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  required
                  placeholder="MCI-2018-99281"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Primary Specialization
                </label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="ENT Specialist">ENT Specialist</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Highest Medical Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  placeholder="MBBS, MD (Medicine), DM"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Years of Clinical Practice
                </label>
                <input
                  type="number"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleChange}
                  min="1"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Languages Spoken
                </label>
                <input
                  type="text"
                  name="languages"
                  value={formData.languages}
                  onChange={handleChange}
                  placeholder="English, Hindi, Bengali"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Hospital & Clinic Affiliation */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} color="#0a4bb5" /> Hospital & Clinic Affiliation
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Primary Clinic or Hospital Name
                </label>
                <input
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleChange}
                  placeholder="Apollo Super Speciality / AIIMS"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Clinic Premise Address
                </label>
                <input
                  type="text"
                  name="clinic_address"
                  value={formData.clinic_address}
                  onChange={handleChange}
                  placeholder="Suite 401, OPD Tower B, Medical Enclave"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Professional Bio & Clinical Philosophy
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your areas of expertise, procedural background, and patient care approach..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
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

        {/* Right Column: Regulatory Verification Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#16a34a" /> Medical Council Verification
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Upload your State or National Medical Council registration certificate for Super Admin accreditation.
            </p>

            {/* Document Uploader */}
            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center',
              background: '#f8fafc',
              marginBottom: '20px'
            }}>
              <Upload size={32} color="#0a4bb5" style={{ margin: '0 auto 8px auto' }} />
              <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>
                Upload Registration Certificate
              </strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>PDF, PNG, or JPG (Max 15MB)</span>

              <label style={{
                display: 'inline-block',
                marginTop: '14px',
                padding: '8px 18px',
                background: '#0a4bb5',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}>
                {uploadingDoc ? 'Uploading...' : 'Choose Certificate File'}
                <input type="file" accept=".pdf,image/*" onChange={handleDocumentUpload} disabled={uploadingDoc} style={{ display: 'none' }} />
              </label>
            </div>

            {/* Uploaded Files */}
            <div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>
                Submitted Compliance Proofs
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                {uploadedFiles.length === 0 ? (
                  <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                    No documents uploaded in this session.
                  </p>
                ) : (
                  uploadedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px',
                        background: '#f1f5f9',
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: '#1e293b'
                      }}
                    >
                      <FileText size={15} color="#0a4bb5" />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </span>
                      <span style={{ color: '#16a34a', fontWeight: '700' }}>✓ Sent</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
