import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../services';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Stethoscope, 
  FileText, 
  ShoppingBag, 
  Calendar, 
  ArrowRight, 
  HeartPulse, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  FolderOpen,
  Lock,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  UserCheck
} from 'lucide-react';

export default function PatientDashboard() {
  const { user, profile, isAuthenticated, loginDemo } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);

  const fetchDashboard = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await patientService.getDashboardSummary(user.id);
      setSummary(data);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Unable to retrieve dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.id]);

  const handleDemoLogin = async () => {
    setDemoLoggingIn(true);
    try {
      await loginDemo('patient');
    } catch (err) {
      alert('Demo evaluation sign-in note: ' + err.message);
    } finally {
      setDemoLoggingIn(false);
    }
  };

  // If unauthenticated, show clean sign-in prompt with 1-click evaluation option
  if (!isAuthenticated && !loading) {
    return (
      <div style={{ padding: '60px 24px', maxWidth: '640px', margin: '0 auto', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '16px',
          background: '#eff6ff',
          color: '#0a4bb5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <Lock size={32} />
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>
          Sign In to Access Your Patient Health Hub
        </h2>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px', lineHeight: '1.5' }}>
          Connect securely to view your live appointments, digital prescriptions, medicine orders, and AI triage history.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
          <Link
            to="/login"
            style={{
              background: '#0a4bb5',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13.5px',
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(10, 75, 181, 0.25)'
            }}
          >
            Sign In with Email
          </Link>
          <button
            onClick={handleDemoLogin}
            disabled={demoLoggingIn}
            style={{
              background: '#f8fafc',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              padding: '12px 20px',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {demoLoggingIn ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} color="#0a4bb5" />}
            <span>1-Click Patient Evaluation</span>
          </button>
        </div>
      </div>
    );
  }

  const patientName = profile?.full_name || profile?.name || user?.user_metadata?.full_name || 'Patient';
  const abhaId = profile?.abha_id || user?.user_metadata?.abha_id || '91-2345-6789-0123';

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
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
        boxShadow: '0 10px 20px -5px rgba(10, 75, 181, 0.25)',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#93c5fd' }}>
              MediMind Smart Patient Hub
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
              ABHA: {abhaId}
            </span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginTop: '6px', margin: 0 }}>
            Welcome, {patientName}!
          </h1>
          <p style={{ fontSize: '13.5px', color: '#e0e7ff', marginTop: '6px', maxWidth: '620px', lineHeight: '1.4' }}>
            AI-driven clinical triage support, verified specialist teleconsultations, tamper-evident digital prescriptions, and licensed pharmacy fulfillment.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchDashboard}
            title="Refresh Dashboard"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              padding: '10px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12.5px',
              fontWeight: '600'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link
            to="/predict"
            style={{
              background: '#ffffff',
              color: '#0a4bb5',
              padding: '11px 20px',
              borderRadius: '9px',
              fontWeight: '800',
              fontSize: '13px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            <Activity size={17} />
            <span>Start AI Symptom Check</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px 18px', color: '#b91c1c', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '13.5px', fontWeight: '600' }}>{error}</span>
          </div>
          <button onClick={fetchDashboard} style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: '700', textDecoration: 'underline', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      )}

      {/* 4 Core Pillars Quick Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <Link to="/predict" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#eff6ff', borderRadius: '10px', color: '#2563eb' }}>
                <Activity size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>1. AI Symptom Checker</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Dual Engine NLP + RF</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Enter symptoms or upload clinical lab slip for instant preliminary assessment and risk triage.
            </p>
          </div>
        </Link>

        <Link to="/doctors" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '10px', color: '#16a34a' }}>
                <Stethoscope size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>2. Consult Doctors</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Verified Clinicians</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Discover approved medical specialists, review availability, and book live teleconsultations.
            </p>
          </div>
        </Link>

        <Link to="/prescriptions" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#f5f3ff', borderRadius: '10px', color: '#7c3aed' }}>
                <FileText size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>3. Digital Prescriptions</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  {summary?.recentPrescriptions?.length || 0} Active Prescriptions
                </span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Tamper-evident authenticated digital Rx issued by verified doctors with daily dosage reminders.
            </p>
          </div>
        </Link>

        <Link to="/pharmacy" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ padding: '10px', background: '#fffbeb', borderRadius: '10px', color: '#d97706' }}>
                <ShoppingBag size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>4. Order Medicines</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Licensed Dispensaries</span>
              </div>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              Attach digital Rx and order authentic medications from licensed stores with FEFO batch delivery.
            </p>
          </div>
        </Link>
      </div>

      {/* Main Grid: Upcoming Appointments & Clinical Baseline Vitals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '28px' }}>
        
        {/* Upcoming Appointments Card */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={19} color="#0a4bb5" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Upcoming Appointments</h3>
            </div>
            <Link to="/patient/appointments" style={{ fontSize: '12.5px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>View All</span> <ChevronRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              <RefreshCw className="animate-spin" size={20} style={{ margin: '0 auto 8px auto' }} />
              Loading appointments...
            </div>
          ) : !summary?.upcomingAppointments || summary.upcomingAppointments.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              <Calendar size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '13.5px', fontWeight: '600', color: '#334155', margin: 0 }}>No upcoming appointments scheduled</p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px 0' }}>Consult with top specialists online or in-person.</p>
              <Link to="/doctors" style={{ display: 'inline-block', background: '#0a4bb5', color: '#ffffff', padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                Book Appointment
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {summary.upcomingAppointments.map((appt) => (
                <div key={appt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                        Dr. {appt.doctor?.full_name || 'Specialist'}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        ({appt.doctor?.specialization || 'Consultant'})
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📅 {appt.appointment_date}</span>
                      <span>⏰ {appt.time_slot}</span>
                      {appt.doctor?.clinic_name && <span>🏥 {appt.doctor.clinic_name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      background: appt.status === 'confirmed' ? '#dcfce7' : '#eff6ff',
                      color: appt.status === 'confirmed' ? '#15803d' : '#1d4ed8'
                    }}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clinical Baseline Vitals Card */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={20} color="#dc2626" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Clinical Baseline Vitals</h3>
            </div>
            <Link to="/patient/profile" style={{ fontSize: '12.5px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>
              Edit Profile →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Blood Pressure</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {summary?.vitals?.bp_systolic || 120} / {summary?.vitals?.bp_diastolic || 80}
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', marginLeft: '4px' }}>mmHg</span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Fasting Blood Sugar</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {summary?.vitals?.blood_sugar || 100}
                <span style={{ fontSize: '11px', fontWeight: '500', color: '#64748b', marginLeft: '4px' }}>mg/dL</span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Body Mass Index</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                {summary?.vitals?.bmi || 22.0}
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginLeft: '6px' }}>Normal</span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Smoking Status</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                {summary?.vitals?.is_smoker ? 'Smoker' : 'Non-Smoker'}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', padding: '10px 12px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>
              Interactive Physiological Avatar
            </span>
            <Link to="/twin" style={{ fontSize: '11.5px', color: '#0a4bb5', fontWeight: '800', textDecoration: 'none' }}>
              Launch Digital Twin 🚀
            </Link>
          </div>
        </div>

      </div>

      {/* Secondary Grid: Recent AI Assessments & Recent Medicine Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Recent AI Assessments */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#2563eb" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Recent AI Triage Assessments</h3>
            </div>
            <Link to="/predict" style={{ fontSize: '12.5px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>
              New Check +
            </Link>
          </div>

          {!summary?.recentAssessments || summary.recentAssessments.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
              <Activity size={28} color="#94a3b8" style={{ margin: '0 auto 6px auto' }} />
              <p style={{ fontSize: '13px', margin: 0, fontWeight: '500' }}>No recent symptom assessments recorded.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {summary.recentAssessments.map((a) => (
                <div key={a.id} style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: a.risk_level === 'High' ? '#fee2e2' : a.risk_level === 'Moderate' ? '#fef3c7' : '#dcfce7',
                      color: a.risk_level === 'High' ? '#b91c1c' : a.risk_level === 'Moderate' ? '#92400e' : '#15803d'
                    }}>
                      {a.risk_level} Risk Assessment
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#334155', fontWeight: '600', marginTop: '6px' }}>
                    Symptoms: {(a.symptoms || []).join(', ')}
                  </div>
                  {a.ai_summary && (
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                      {a.ai_summary}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Medicine Orders */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} color="#d97706" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Recent Medicine Orders</h3>
            </div>
            <Link to="/patient/orders" style={{ fontSize: '12.5px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>
              View Orders →
            </Link>
          </div>

          {!summary?.recentOrders || summary.recentOrders.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '10px' }}>
              <ShoppingBag size={28} color="#94a3b8" style={{ margin: '0 auto 6px auto' }} />
              <p style={{ fontSize: '13px', margin: 0, fontWeight: '500' }}>No medicine orders placed yet.</p>
              <Link to="/pharmacy" style={{ display: 'inline-block', marginTop: '8px', color: '#0a4bb5', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                Browse Pharmacy Catalog →
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {summary.recentOrders.map((ord) => (
                <div key={ord.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{ord.order_number}</strong>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      {ord.pharmacy?.pharmacy_name || 'Accredited Dispensary'} • ₹{Number(ord.total_amount).toFixed(2)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: ord.order_status === 'delivered' ? '#dcfce7' : ord.order_status === 'cancelled' ? '#fee2e2' : '#eff6ff',
                    color: ord.order_status === 'delivered' ? '#15803d' : ord.order_status === 'cancelled' ? '#b91c1c' : '#1d4ed8',
                    textTransform: 'capitalize'
                  }}>
                    {ord.order_status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
