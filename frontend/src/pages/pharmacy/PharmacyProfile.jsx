import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services';
import {
  Store,
  ShieldCheck,
  Building,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileCheck
} from 'lucide-react';

export default function PharmacyProfile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    pharmacy_name: '',
    drug_license_number: '',
    gstin: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    operating_hours: '08:00 AM - 10:00 PM',
    verification_status: 'pending'
  });

  const [uploadedFiles, setUploadedFiles] = useState([]);

  const fetchProfile = async () => {
    if (!user && !profile) {
      setLoading(false);
      return;
    }
    const pharmacyId = profile?.id || user?.id;
    setLoading(true);
    setError(null);
    try {
      const data = await pharmacyService.getPharmacyProfile(pharmacyId);
      if (data) {
        setFormData({
          pharmacy_name: data.pharmacy_name || profile?.full_name || '',
          drug_license_number: data.drug_license_number || '',
          gstin: data.gstin || '',
          contact_person: data.contact_person || '',
          phone: data.phone || '',
          email: data.email || user?.email || '',
          address: data.address || '',
          operating_hours: data.operating_hours || '08:00 AM - 10:00 PM',
          verification_status: data.verification_status || 'pending'
        });
      }
    } catch (err) {
      console.error('Error fetching pharmacy profile:', err);
      setError(err.message || 'Unable to load dispensary profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
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
    const pharmacyId = profile?.id || user?.id;

    if (!formData.pharmacy_name.trim() || !formData.drug_license_number.trim()) {
      alert('Pharmacy Name and Drug License Number are required.');
      return;
    }

    setSaving(true);
    try {
      await pharmacyService.updatePharmacyProfile(pharmacyId, {
        pharmacy_name: formData.pharmacy_name,
        drug_license_number: formData.drug_license_number,
        gstin: formData.gstin,
        contact_person: formData.contact_person,
        phone: formData.phone,
        email: formData.email,
        address: formData.address,
        operating_hours: formData.operating_hours
      });
      showToast('Dispensary profile and licensing details saved successfully!');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const pharmacyId = profile?.id || user?.id;
    setUploadingDoc(true);
    try {
      const path = await pharmacyService.uploadPharmacyDocument(pharmacyId, file, 'State Drug Retail License');
      setUploadedFiles((prev) => [...prev, { name: file.name, path, date: new Date().toLocaleDateString() }]);
      showToast('Drug license certificate submitted for Admin verification!');
    } catch (err) {
      alert('Document upload failed: ' + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return { bg: '#dcfce7', color: '#15803d', label: 'Licensed & Verified Dispensary', icon: CheckCircle2 };
      case 'rejected':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'License Rejected', icon: AlertCircle };
      default:
        return { bg: '#fef3c7', color: '#b45309', label: 'Pending Regulatory Verification', icon: Clock };
    }
  };

  const badge = getStatusBadge(formData.verification_status);
  const BadgeIcon = badge.icon;

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Loading Pharmacy Profile & Licensing...</p>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>
            <Store size={18} /> RETAIL PHARMACY ACCREDITATION
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Pharmacy Store & License Profile
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Manage dispensary business information, State Drug Control license registration, and premises compliance documents.
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
          {/* Section 1: Business Identity & Drug License */}
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={18} color="#0a4bb5" /> Dispensary Licensing & Business Identity
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Pharmacy Registered Name *
                </label>
                <input
                  type="text"
                  name="pharmacy_name"
                  value={formData.pharmacy_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Apollo Pharmacy #104"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Drug Retail License Number (Form 20/21) *
                </label>
                <input
                  type="text"
                  name="drug_license_number"
                  value={formData.drug_license_number}
                  onChange={handleChange}
                  required
                  placeholder="DL-2023-WB-8829"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  GSTIN Registration Number
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleChange}
                  placeholder="19AAAAA0000A1Z5"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Registered Pharmacist / Contact Person
                </label>
                <input
                  type="text"
                  name="contact_person"
                  value={formData.contact_person}
                  onChange={handleChange}
                  placeholder="Pharmacist In-Charge"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Official Contact Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 33 2234 5678"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Dispensary Operating Hours
                </label>
                <input
                  type="text"
                  name="operating_hours"
                  value={formData.operating_hours}
                  onChange={handleChange}
                  placeholder="08:00 AM - 10:00 PM"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Premise Physical Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Shop No. 12, Ground Floor, Health Plaza, Central Road"
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
              {saving ? 'Saving...' : 'Save Pharmacy Profile'}
            </button>
          </div>
        </form>

        {/* Right Column: Drug License Certificate Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#16a34a" /> State Drug Control Verification
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
              Submit scanned copies of Drug License Form 20/21 or Registered Pharmacist registration for Super Admin accreditation.
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
                Upload Retail Drug License
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
                {uploadingDoc ? 'Uploading...' : 'Choose License Document'}
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
