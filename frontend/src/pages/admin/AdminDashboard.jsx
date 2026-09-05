import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Link } from 'react-router-dom';
import { ShieldCheck, Stethoscope, Store, Users, FileText, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingDoctors: 0,
    approvedDoctors: 0,
    pendingPharmacies: 0,
    approvedPharmacies: 0,
    totalPatients: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const allUsers = await adminService.getAllUsers();
      const pDocs = allUsers.filter(u => u.role === 'doctor' && u.approval_status === 'pending').length;
      const aDocs = allUsers.filter(u => u.role === 'doctor' && u.approval_status === 'approved').length;
      const pPharms = allUsers.filter(u => u.role === 'pharmacy' && u.approval_status === 'pending').length;
      const aPharms = allUsers.filter(u => u.role === 'pharmacy' && u.approval_status === 'approved').length;
      const pats = allUsers.filter(u => u.role === 'patient').length;

      setStats({
        pendingDoctors: pDocs,
        approvedDoctors: aDocs,
        pendingPharmacies: pPharms,
        approvedPharmacies: aPharms,
        totalPatients: pats
      });
    } catch (err) {
      console.error('Error loading admin statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
          <ShieldCheck size={18} /> SUPER ADMIN PORTAL (PLATFORM GOVERNANCE)
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
          Platform Master Controls & Approval Gates
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Enforcing clinical compliance, doctor credentialing, pharmacy licensing, and HIPAA-like audit security.
        </p>
      </div>

      {/* Mandatory Approval Gate Alert Banner */}
      {(stats.pendingDoctors > 0 || stats.pendingPharmacies > 0) && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle color="#d97706" size={24} />
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#92400e' }}>
                Admin Approval Gate: Pending Clinical Verifications
              </h4>
              <p style={{ fontSize: '12px', color: '#b45309', marginTop: '2px' }}>
                There are <strong>{stats.pendingDoctors} Doctor(s)</strong> and <strong>{stats.pendingPharmacies} Pharmacy(s)</strong> awaiting credential approval. Non-approved practitioners cannot practice or appear in search.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              to="/admin/doctor-approvals"
              style={{
                background: '#d97706',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Verify Doctors
            </Link>
            <Link
              to="/admin/pharmacy-approvals"
              style={{
                background: '#b45309',
                color: '#ffffff',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              Verify Pharmacies
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px' }}>
            <span>Pending Doctors</span>
            <Stethoscope size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '10px' }}>
            {stats.pendingDoctors}
          </div>
          <Link to="/admin/doctor-approvals" style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
            Review Applications <ArrowRight size={12} />
          </Link>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px' }}>
            <span>Approved Doctors</span>
            <CheckCircle size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '10px' }}>
            {stats.approvedDoctors}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '8px' }}>Active in search directory</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px' }}>
            <span>Approved Pharmacies</span>
            <Store size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', marginTop: '10px' }}>
            {stats.approvedPharmacies}
          </div>
          <Link to="/admin/pharmacy-approvals" style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
            Manage Stores <ArrowRight size={12} />
          </Link>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px' }}>
            <span>Registered Patients</span>
            <Users size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', marginTop: '10px' }}>
            {stats.totalPatients}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '8px' }}>AI Triage & Portal users</span>
        </div>
      </div>

      {/* Quick Governance Links */}
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
        Administrative Controls & Compliance Modules
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        <Link
          to="/admin/doctor-approvals"
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.2s',
            display: 'block'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '8px', color: '#2563eb' }}>
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>12. Doctor Verification</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Check MCI credentials & approve practice</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/pharmacy-approvals"
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '8px', color: '#16a34a' }}>
              <Store size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>13. Pharmacy Verification</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Verify drug licenses & authorize orders</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          style={{
            background: '#ffffff',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textDecoration: 'none',
            color: 'inherit',
            display: 'block'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: '#f5f3ff', borderRadius: '8px', color: '#7c3aed' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>9. Audit & Logging Service</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>View regulatory audit trails & access logs</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
