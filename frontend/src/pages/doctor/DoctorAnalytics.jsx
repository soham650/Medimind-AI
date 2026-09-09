import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services/doctor.service';
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  UserX, 
  Video, 
  Building, 
  RefreshCw,
  Clock,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

export default function DoctorAnalytics() {
  const { user, profile } = useAuth();
  const doctorId = profile?.id || user?.id;

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const loadAnalytics = async () => {
    if (!doctorId) return;
    setLoading(true);
    try {
      const data = await doctorService.getDoctorAnalytics(doctorId);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load doctor analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [doctorId]);

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0f766e" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Aggregating Practice Database Metrics...</p>
      </div>
    );
  }

  const {
    totalConsultations = 0,
    activeScheduled = 0,
    cancelledCount = 0,
    noShowCount = 0,
    uniquePatientsTreated = 0,
    prescriptionsIssued = 0,
    consultationTypeDistribution = { video: 0, inPerson: 0 },
    monthlyTrend = []
  } = analytics || {};

  const totalAllAppointments = totalConsultations + activeScheduled + cancelledCount + noShowCount;
  const completionRate = totalAllAppointments > 0 ? Math.round((totalConsultations / totalAllAppointments) * 100) : 100;

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ccfbf1', color: '#0f766e', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px', marginBottom: '6px' }}>
            <TrendingUp size={13} /> CLINICAL PRACTICE ANALYTICS
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
            Physician Productivity & Clinical Telemetry
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Real-time aggregates computed strictly from your live Supabase appointments, consultations, and prescriptions.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} /> Refresh Metrics
        </button>
      </div>

      {/* 6 Top Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>COMPLETED VISITS</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{totalConsultations}</div>
          <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: '600' }}>{completionRate}% Completion Rate</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>SCHEDULED / ACTIVE</span>
            <Calendar size={16} color="#0f766e" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{activeScheduled}</div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Upcoming in queue</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>PATIENTS TREATED</span>
            <Users size={16} color="#2563eb" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{uniquePatientsTreated}</div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Distinct patient IDs</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>PRESCRIPTIONS ISSUED</span>
            <FileText size={16} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{prescriptionsIssued}</div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Atomic create_prescription_tx</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#b91c1c' }}>CANCELLED APPOINTMENTS</span>
            <XCircle size={16} color="#dc2626" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#dc2626', marginTop: '6px' }}>{cancelledCount}</div>
          <span style={{ fontSize: '11.5px', color: '#b91c1c' }}>With documented reasons</span>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b' }}>PATIENT NO-SHOWS</span>
            <UserX size={16} color="#64748b" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#475569', marginTop: '6px' }}>{noShowCount}</div>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>Attendance logged</span>
        </div>
      </div>

      {/* 2 Visual Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* Monthly Encounter Volume Chart */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            Monthly Consultation Volume
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
            Completed consultations grouped by month from database records.
          </p>

          {monthlyTrend.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No completed monthly consultations recorded yet.
            </div>
          ) : (
            <div style={{ height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="completed" fill="#0f766e" radius={[4, 4, 0, 0]} name="Completed Visits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Consultation Mode Breakdown */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            Consultation Modality Breakdown
          </h3>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 20px 0' }}>
            Distribution between Telehealth Video vs In-Person clinic encounters.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Video size={15} color="#2563eb" /> Video Teleconsultations
                </span>
                <strong style={{ fontSize: '14px', color: '#2563eb' }}>
                  {consultationTypeDistribution.video} visits
                </strong>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(consultationTypeDistribution.video + consultationTypeDistribution.inPerson) > 0 ? (consultationTypeDistribution.video / (consultationTypeDistribution.video + consultationTypeDistribution.inPerson)) * 100 : 0}%`,
                  height: '100%',
                  background: '#2563eb'
                }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Building size={15} color="#0f766e" /> In-Person Clinic Visits
                </span>
                <strong style={{ fontSize: '14px', color: '#0f766e' }}>
                  {consultationTypeDistribution.inPerson} visits
                </strong>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(consultationTypeDistribution.video + consultationTypeDistribution.inPerson) > 0 ? (consultationTypeDistribution.inPerson / (consultationTypeDistribution.video + consultationTypeDistribution.inPerson)) * 100 : 0}%`,
                  height: '100%',
                  background: '#0f766e'
                }}></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '28px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#0f766e" /> Financial Data Protection: Revenue computation strictly relies on verified payment transactions.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
