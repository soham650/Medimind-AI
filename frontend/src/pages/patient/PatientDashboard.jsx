import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { Link } from 'react-router-dom';
import { Activity, Stethoscope, FileText, ShoppingCart, Calendar, ArrowRight, UserCheck, HeartPulse } from 'lucide-react';

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        appointmentService.getPatientAppointments(user.id),
        prescriptionService.getPatientPrescriptions(user.id)
      ]).then(([appts, rxs]) => {
        setAppointments(appts || []);
        setPrescriptions(rxs || []);
        setLoading(false);
      }).catch(err => {
        console.error('Error loading patient dashboard:', err);
        setLoading(false);
      });
    }
  }, [user]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0a4bb5 0%, #1e40af 100%)',
        borderRadius: '16px',
        padding: '28px 32px',
        color: '#ffffff',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 10px 15px -3px rgba(10, 75, 181, 0.2)'
      }}>
        <div>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#93c5fd' }}>
            MediMind Smart Healthcare Hub
          </span>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px' }}>
            Welcome, {profile?.full_name || profile?.name || user?.user_metadata?.full_name || 'Rahul Sharma'}!
          </h1>
          <p style={{ fontSize: '14px', color: '#e0e7ff', marginTop: '4px', maxWidth: '560px' }}>
            Access AI-driven triage diagnosis, book verified doctors, review your digital prescriptions, and order medications.
          </p>
        </div>

        <Link
          to="/predict"
          style={{
            background: '#ffffff',
            color: '#0a4bb5',
            padding: '12px 20px',
            borderRadius: '10px',
            fontWeight: '800',
            fontSize: '13px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Activity size={18} /> Start AI Symptom Check
        </Link>
      </div>

      {/* 4 Core Pillars Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <Link to="/predict" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '10px', color: '#2563eb' }}>
                <Activity size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>1. AI Symptom Checker</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Triage & Risk Classifier</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b' }}>Check symptoms with NLP and obtain instant risk triage recommendations.</p>
          </div>
        </Link>

        <Link to="/doctors" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '10px', color: '#16a34a' }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>2. Consult Doctors</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Admin Approved Only</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b' }}>Book teleconsultations with certified, credentialed medical specialists.</p>
          </div>
        </Link>

        <Link to="/prescriptions" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#f5f3ff', borderRadius: '10px', color: '#7c3aed' }}>
                <FileText size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>4. Digital Rx</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{prescriptions.length} Active Prescriptions</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b' }}>View tamper-evident digital prescriptions with unique authenticated Rx IDs.</p>
          </div>
        </Link>

        <Link to="/pharmacy" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '10px', color: '#d97706' }}>
                <ShoppingCart size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>5. Order Medicines</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Licensed Dispensaries</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b' }}>Attach digital Rx and order genuine medicines for fast doorstep fulfillment.</p>
          </div>
        </Link>
      </div>

      {/* Grid: Upcoming Appointments & Digital Vitals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Appointments Queue */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>My Upcoming Appointments</h3>
            <Link to="/doctors" style={{ fontSize: '12.5px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>
              + Book New
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
              <Calendar size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '13px' }}>No upcoming appointments scheduled.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {appointments.slice(0, 4).map(appt => (
                <div key={appt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Dr. {appt.doctor?.full_name}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{appt.doctor?.specialist} | {appt.appointment_date} ({appt.time_slot})</div>
                  </div>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '700' }}>
                    {appt.consultation_type.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Digital Twin & Vitals Tracker */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={20} color="#dc2626" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Health Baseline</h3>
            </div>
            <Link to="/twin" style={{ fontSize: '12.5px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>
              Patient Twin →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Blood Pressure</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {profile?.bp_systolic || 120} / {profile?.bp_diastolic || 80} <span style={{ fontSize: '11px', fontWeight: '400', color: '#64748b' }}>mmHg</span>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Fasting Blood Sugar</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {profile?.blood_sugar || 98} <span style={{ fontSize: '11px', fontWeight: '400', color: '#64748b' }}>mg/dL</span>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Body Mass Index</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {profile?.bmi || 22.4} <span style={{ fontSize: '11px', fontWeight: '400', color: '#16a34a' }}>Normal</span>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Smoking Habit</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {profile?.smoking ? 'Smoker' : 'Non-Smoker'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
