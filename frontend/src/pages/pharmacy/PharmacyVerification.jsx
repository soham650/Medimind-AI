import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services';
import {
  ShieldCheck,
  FileCheck,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ExternalLink,
  RefreshCw,
  Lock,
  Building
} from 'lucide-react';

export default function PharmacyVerification() {
  const { user, profile } = useAuth();
  const [verification, setVerification] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('Drug Retail License (Form 20/21)');
  const [toastMessage, setToastMessage] = useState(null);

  const pharmacyId = profile?.id || user?.id;

  const loadVerificationData = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const [verif, pharm] = await Promise.all([
        pharmacyService.getPharmacyVerification(pharmacyId),
        pharmacyService.getPharmacyProfile(pharmacyId)
      ]);
      setVerification(verif);
      setPharmacy(pharm);
    } catch (err) {
      console.error('Error loading verification status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVerificationData();
  }, [pharmacyId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    setUploadingDoc(true);
    try {
      const path = await pharmacyService.uploadPharmacyDocument(pharmacyId, file, selectedDocType);
      showToast(`${selectedDocType} uploaded securely to private vault!`);
      await loadVerificationData();
    } catch (err) {
      alert('Document upload failed: ' + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleViewDocument = async (path) => {
    try {
      const url = await pharmacyService.getDocumentSignedUrl(path, 600);
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert('Failed to retrieve private document: ' + err.message);
    }
  };

  const status = pharmacy?.verification_status || verification?.status || 'pending';

  const getStatusDisplay = () => {
    switch (status) {
      case 'approved':
        return {
          bg: '#dcfce7',
          border: '#bbf7d0',
          color: '#15803d',
          label: 'VERIFIED & LICENSED DISPENSARY',
          description: 'Your State Drug Control retail license and credentials have been verified by state medical administration.',
          icon: CheckCircle2
        };
      case 'rejected':
        return {
          bg: '#fee2e2',
          border: '#fecaca',
          color: '#b91c1c',
          label: 'VERIFICATION REJECTED',
          description: verification?.rejection_reason || 'Verification was declined due to incomplete compliance documentation. Please review and resubmit.',
          icon: XCircle
        };
      default:
        return {
          bg: '#fef3c7',
          border: '#fde68a',
          color: '#b45309',
          label: 'REGULATORY REVIEW IN PROGRESS',
          description: 'Your pharmaceutical license and establishment documents are under review by State Medical Governance.',
          icon: Clock
        };
    }
  };

  const statusInfo = getStatusDisplay();
  const StatusIcon = statusInfo.icon;

  const docTypes = [
    'Drug Retail License (Form 20/21)',
    'Registered Pharmacist Certificate',
    'GSTIN Registration Certificate',
    'Premises Rent / Ownership Deed',
    'Cold Chain Storage Compliance'
  ];

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
            <ShieldCheck size={18} /> STATE DRUG CONTROL COMPLIANCE
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Pharmacy Accreditation & Verification
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Submit regulatory documentation to legally dispense digital prescriptions and fulfill pharmaceutical orders.
          </p>
        </div>

        <button
          onClick={loadVerificationData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '10px 16px',
            color: '#334155',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Status
        </button>
      </div>

      {/* Status Banner */}
      <div style={{
        background: statusInfo.bg,
        border: `1px solid ${statusInfo.border}`,
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px'
      }}>
        <StatusIcon size={32} color={statusInfo.color} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: statusInfo.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {statusInfo.label}
          </div>
          <p style={{ fontSize: '14px', color: '#334155', margin: '6px 0 0 0', lineHeight: 1.5 }}>
            {statusInfo.description}
          </p>
          {pharmacy?.drug_license_number && (
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginTop: '8px' }}>
              Drug License Reference: <span style={{ fontFamily: 'monospace', color: '#0f172a' }}>{pharmacy.drug_license_number}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Upload New Document Box */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} color="#0a4bb5" /> Upload Regulatory Document
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
            Files are stored with private signed-URL isolation in bucket <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>pharmacy-documents</code>.
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
              Document Classification
            </label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#ffffff' }}
            >
              {docTypes.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '32px 20px',
            textAlign: 'center',
            background: '#f8fafc',
            cursor: 'pointer',
            marginBottom: '16px',
            position: 'relative'
          }}>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={uploadingDoc}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer'
              }}
            />
            {uploadingDoc ? (
              <div>
                <RefreshCw size={28} className="animate-spin" color="#0a4bb5" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '13px', color: '#0a4bb5', fontWeight: '700', margin: 0 }}>Encrypting & uploading document...</p>
              </div>
            ) : (
              <div>
                <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
                  Click to select certificate or drag & drop
                </p>
                <span style={{ fontSize: '12px', color: '#64748b' }}>PDF, PNG, JPG up to 10MB</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <Lock size={14} color="#059669" />
            <span>Private storage bucket with signed-URL authorization.</span>
          </div>
        </div>

        {/* Submitted Documents List */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck size={18} color="#059669" /> Verification Package Documents
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
            Official credentials submitted for medical council audit.
          </p>

          {!verification?.submitted_documents || verification.submitted_documents.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
              <Building size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '13px', margin: 0 }}>No verification documents uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {verification.submitted_documents.map((doc, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{doc.type}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {doc.file_name || 'certificate.pdf'} • {new Date(doc.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDocument(doc.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      color: '#0a4bb5',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={12} /> View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
