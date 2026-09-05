import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { 
  Users, 
  UserSquare2, 
  DollarSign, 
  CalendarCheck,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function Analytics() {
  const { token } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  // HSL colors for Pie chart slices
  const COLORS = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Demographics format mapping
  const getGenderData = () => {
    if (!data?.demographics?.gender) return [];
    return Object.keys(data.demographics.gender).map(gender => ({
      name: gender,
      value: data.demographics.gender[gender]
    }));
  };

  const getAgeData = () => {
    if (!data?.demographics?.age) return [];
    return Object.keys(data.demographics.age).map(age => ({
      name: age,
      count: data.demographics.age[age]
    }));
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }} className="text-glow-purple">Hospital & Doctor Clinical Dashboard</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px' }}>Real-time statistics of patient demographics, diagnostics, and consult loads</p>
        </div>
        <button 
          onClick={fetchAnalytics} 
          className="btn btn-secondary" 
          style={{ padding: '8px', borderRadius: '8px' }}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
          <RefreshCw size={36} className="spin" style={{ color: '#8b5cf6' }} />
          <span style={{ color: '#94a3b8' }}>Aggregating clinical records and revenue logs...</span>
        </div>
      ) : data ? (
        <>
          {/* Summary stats row */}
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                <Users size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Patients</span>
                <h2 style={{ fontSize: '26px', fontWeight: '800' }}>{data.summary.totalPatients}</h2>
              </div>
            </div>

            <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                <UserSquare2 size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Active Clinicians</span>
                <h2 style={{ fontSize: '26px', fontWeight: '800' }}>{data.summary.totalDoctors}</h2>
              </div>
            </div>

            <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#10b981' }}>
                <CalendarCheck size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Appointments</span>
                <h2 style={{ fontSize: '26px', fontWeight: '800' }}>{data.summary.totalAppointments}</h2>
              </div>
            </div>

            <div className="glass-panel" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>OPD Revenue</span>
                <h2 style={{ fontSize: '26px', fontWeight: '800' }}>₹{data.summary.totalRevenue}</h2>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Diagnoses & Clinic Activity */}
          <div className="grid-2">
            
            {/* Common Diagnoses Bar Chart */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }} className="text-glow-cyan">
                Common Diagnosed Ailments
              </h3>
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.commonDiagnoses} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="disease" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Diagnosed Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Clinic Speciality Pie Chart */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }} className="text-glow-purple">
                Clinic Speciality Distribution
              </h3>
              <div style={{ display: 'flex', width: '100%', height: '260px', alignItems: 'center' }}>
                <div style={{ width: '50%', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.clinicActivity}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.clinicActivity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {data.clinicActivity.map((entry, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: COLORS[index % COLORS.length] }}></span>
                      <span style={{ color: '#cbd5e1' }}>{entry.name}: <strong>{entry.value} clinics</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Charts Row 2: Demographics & Doctor list */}
          <div className="grid-main-sidebar">
            
            {/* Age Distribution */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }} className="text-glow-cyan">
                Patient Age Group Demographics
              </h3>
              <div style={{ width: '100%', height: '260px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAgeData()} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Patient Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Doctor work load details */}
            <div className="glass-panel" style={{ height: 'fit-content' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }} className="text-glow-purple">
                Doctor Workload Splits
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.doctors.map((doc, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: 'white' }}>{doc.name}</strong>
                      <span style={{ fontSize: '12px', color: '#06b6d4', fontWeight: '700' }}>₹{doc.revenueGenerated}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1' }}>
                      <span>{doc.speciality}</span>
                      <span>Appointments: {doc.appointmentsCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      ) : (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
          No records could be loaded.
        </div>
      )}

    </div>
  );
}
