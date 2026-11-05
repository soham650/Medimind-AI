import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Shield,
  Phone,
  Calendar,
  Heart,
  FileText,
  X,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPatients({
        search: searchQuery,
        limit: 100
      });
      setPatients(res.patients);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPatients();
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#f5f3ff', borderRadius: '6px', color: '#7c3aed', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Users size={16} /> Patient Registry & Administration
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Patient Demographic Directory
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Administrative registry of registered patients, ABHA identity links, and account governance.
          </p>
        </div>

        <button
          onClick={fetchPatients}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Privacy Notice Banner */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <div style={{ background: '#7c3aed', color: '#ffffff', padding: '8px', borderRadius: '8px' }}>
          <Shield size={18} />
        </div>
        <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
          <strong style={{ color: '#0f172a' }}>HIPAA & ABDM Least-Privilege Guard:</strong> Administrative access is restricted to demographic metadata, registration records, and contact verification. Diagnostic findings, physician notes, and laboratory files remain compartmentalized within physician-patient consent sessions.
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '400px', width: '100%' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by patient name, phone, ABHA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              background: '#7c3aed',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Search
          </button>
        </form>

        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
          Total Registered: {totalCount} Patients
        </div>
      </div>

      {/* Patients Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#7c3aed' }} />
            Loading patients registry...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No patient records found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Patient Name</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Phone</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Gender / DOB</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Blood Group</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>ABHA Address</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Registered On</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                          {(p.full_name || 'P')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>
                            {p.full_name || 'Anonymous Patient'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {p.id.slice(0, 12)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {p.phone || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#475569' }}>
                      {p.gender || '—'} {p.date_of_birth ? `(${p.date_of_birth})` : ''}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.blood_group ? (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', fontWeight: '700', fontSize: '11px' }}>
                          {p.blood_group}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#2563eb', fontFamily: 'monospace', fontSize: '12px' }}>
                      {p.abha_id || 'Not linked'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedPatient(p)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        <Eye size={13} /> View Demographics
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Demographics Modal */}
      {selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Patient Demographic Card
              </h3>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px' }}>
                <span style={{ color: '#64748b', fontWeight: '600' }}>Patient ID:</span>
                <span style={{ fontFamily: 'monospace', color: '#334155' }}>{selectedPatient.id}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Full Name:</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>{selectedPatient.full_name}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Phone:</span>
                <span style={{ color: '#334155' }}>{selectedPatient.phone || 'Not recorded'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Date of Birth:</span>
                <span>{selectedPatient.date_of_birth || 'Not recorded'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Gender:</span>
                <span>{selectedPatient.gender || 'Not specified'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Blood Group:</span>
                <span style={{ fontWeight: '700', color: '#b91c1c' }}>{selectedPatient.blood_group || 'Not recorded'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>ABHA Address:</span>
                <span style={{ color: '#2563eb', fontFamily: 'monospace' }}>{selectedPatient.abha_id || 'Not linked'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Preferred Language:</span>
                <span>{selectedPatient.preferred_language || 'English'}</span>

                <span style={{ color: '#64748b', fontWeight: '600' }}>Registered Date:</span>
                <span>{selectedPatient.created_at ? new Date(selectedPatient.created_at).toLocaleString() : '—'}</span>
              </div>

              <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  Clinical history, encounter records, and prescription notes are confidential patient health information and are strictly excluded from administrative cards.
                </span>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link
                to="/admin/users"
                style={{ fontSize: '13px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Manage in User Governance <ArrowRight size={13} />
              </Link>
              <button
                onClick={() => setSelectedPatient(null)}
                style={{ padding: '8px 16px', background: '#334155', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}
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
