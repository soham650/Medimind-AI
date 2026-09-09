import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctor.service';
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
  ExternalLink,
  Lock,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export default function DoctorProfile() {
  const { user, profile } = useAuth();
  const doctorId = profile?.id || user?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    license_number: '',
    specialization: 'General Medicine',
    qualification: 'MBBS',
    experience_years: 5,
    clinic_name: 'MediMind Clinical Centre',
    clinic_address: '',
    bio: '',
    languages: 'English, Hindi',
    consultation_fee: 500,
    verification_status: 'pending'
  });

  const [verifications, setVerifications] = useState([]);
  const [documentType, setDocumentType] = useState('Medical Registration Certificate');

  const fetchDoctorProfile = async () => {
    if (!doctorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [docData, verData] = await Promise.all([
        doctorService.getDoctorProfile(doctorId),
        doctorService.getDoctorVerifications(doctorId)
      ]);

      if (docData) {
        setFormData({
          full_name: docData.full_name || profile?.full_name || '',
          license_number: docData.license_number || '',
          specialization: docData.specialization || 'General Medicine',
          qualification: docData.qualification || 'MBBS',
          experience_years: docData.experience_years || 5,
          clinic_name: docData.clinic_name || 'MediMind Clinical Centre',
          clinic_address: docData.clinic_address || '',
          bio: docData.bio || '',
          languages: Array.isArray(docData.languages) ? docData.languages.join(', ') : (docData.languages || 'English, Hindi'),
          consultation_fee: docData.consultation_fee || 500,
          verification_status: docData.verification_status || 'pending'
        });
      }

      setVerifications(verData || []);
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      setError(err.message || 'Unable to retrieve clinical profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, [doctorId]);

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
    if (!formData.full_name.trim() || !formData.license_number.trim()) {
      alert('Full Name and Medical Registration / License Number are required.');
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
        experience_years: parseInt(formData.experience_years, 10) || 5,
        clinic_name: formData.clinic_name,
        clinic_address: formData.clinic_address,
        bio: formData.bio,
        languages: languagesArray,
        consultation_fee: parseFloat(formData.consultation_fee) || 500
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

    setUploadingDoc(true);
    try {
      await doctorService.uploadDoctorDocument(doctorId, file, documentType);
      showToast('Verification document uploaded to private vault for Admin review!');
      await fetchDoctorProfile();
    } catch (err) {
      alert('Document upload failed: ' + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', color: '#15803d', label: 'Verified Practitioner (Admin Approved)', icon: CheckCircle2 };
      case 'rejected':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Verification Rejected', icon: AlertCircle };
      case 'suspended':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'License Suspended', icon: AlertTriangle };
      default:
        return { bg: '#fef3c7', color: '#b45309', label: 'Pending Admin Verification', icon: Clock };
    }
  };

  const badge = getStatusBadge(formData.verification_status);
  const BadgeIcon = badge.icon;

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0f766e" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Hydrating Doctor Clinical Profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1080px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0f766e',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          fontWeight: '700',
          fontSize: '13px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} /> {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{
            background: badge.bg,
            color: badge.color,
            fontSize: '12px',
            fontWeight: '800',
            padding: '4px 10px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <BadgeIcon size={14} /> {badge.label}
          </span>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
            ID: {doctorId}
          </span>
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Physician Profile & Credential Verification
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
          Maintain verified practice details, medical council registration, and compliance documents.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        
        {/* Left Column: Profile Form */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
            Clinical Practitioner Information
          </h2>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Medical Council Reg / License # *
                </label>
                <input
                  type="text"
                  name="license_number"
                  value={formData.license_number}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Primary Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Qualifications (e.g. MBBS, MD, DM)
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Experience (Years)
                </label>
                <input
                  type="number"
                  name="experience_years"
                  min="0"
                  max="60"
                  value={formData.experience_years}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  name="consultation_fee"
                  min="0"
                  step="50"
                  value={formData.consultation_fee}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Clinic / Hospital Affiliation
              </label>
              <input
                type="text"
                name="clinic_name"
                value={formData.clinic_name}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Clinic Address
              </label>
              <input
                type="text"
                name="clinic_address"
                value={formData.clinic_address}
                onChange={handleChange}
                placeholder="Hospital wing, suite, city..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Spoken Languages (comma-separated)
              </label>
              <input
                type="text"
                name="languages"
                value={formData.languages}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Professional Biography & Clinical Focus
              </label>
              <textarea
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Clinical background, special interests, and approach to patient care..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Clinical Profile'}
            </button>
          </form>
        </div>

        {/* Right Column: Verification & Documents */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Document Upload Card */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} color="#0f766e" /> Private Credential Vault
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Upload professional degrees and medical registration certificates. Files are stored in the private <code>doctor-documents</code> bucket with signed URL access.
            </p>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                Document Category
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                <option value="Medical Registration Certificate">Medical Registration Certificate</option>
                <option value="Degree Certificate (MBBS / MD)">Degree Certificate (MBBS / MD)</option>
                <option value="National Medical Council ID">National Medical Council ID</option>
                <option value="Hospital Privileges Letter">Hospital Privileges Letter</option>
              </select>
            </div>

            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              background: '#f8fafc',
              cursor: 'pointer'
            }}>
              <Upload size={24} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#0f766e', cursor: 'pointer' }}>
                {uploadingDoc ? 'Uploading...' : 'Choose PDF or Image to Upload'}
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleDocumentUpload}
                  disabled={uploadingDoc}
                  style={{ display: 'none' }}
                />
              </label>
              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                Max 10 MB • Stored with SHA-256 Vault Encryption
              </span>
            </div>
          </div>

          {/* Verification Submissions History */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0' }}>
              Submitted Verification Records
            </h4>

            {verifications.length === 0 ? (
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
                No verification documents submitted yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {verifications.map((ver) => (
                  <div
                    key={ver.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: ver.status === 'approved' ? '#dcfce7' : (ver.status === 'rejected' ? '#fee2e2' : '#fef3c7'),
                        color: ver.status === 'approved' ? '#166534' : (ver.status === 'rejected' ? '#991b1b' : '#92400e')
                      }}>
                        {ver.status}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(ver.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {ver.rejection_reason && (
                      <div style={{ fontSize: '11.5px', color: '#dc2626', background: '#fef2f2', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px' }}>
                        <strong>Rejection Reason:</strong> {ver.rejection_reason}
                      </div>
                    )}

                    {(ver.submitted_documents || []).map((doc, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
                        <span style={{ color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={13} color="#0f766e" /> {doc.type || doc.file_name}
                        </span>
                        {doc.signedUrl && (
                          <a
                            href={doc.signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#0f766e', fontWeight: '700', fontSize: '11px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}
                          >
                            View <ExternalLink size={11} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
