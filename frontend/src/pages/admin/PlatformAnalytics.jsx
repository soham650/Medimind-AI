import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import {
  TrendingUp,
  Activity,
  DollarSign,
  Calendar,
  ShoppingBag,
  Stethoscope,
  Store,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function PlatformAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPlatformAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load platform analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const appointments = data?.appointments || [];
  const orders = data?.orders || [];
  const doctors = data?.doctors || [];
  const pharmacies = data?.pharmacies || [];

  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const pendingAppts = appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length;
  const cancelledAppts = appointments.filter(a => a.status === 'cancelled').length;

  const totalRevenue = orders
    .filter(o => o.order_status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const completedOrders = orders.filter(o => o.order_status === 'delivered' || o.order_status === 'completed').length;
  const pendingOrders = orders.filter(o => o.order_status === 'pending' || o.order_status === 'processing').length;

  const approvedDoctors = doctors.filter(d => d.verification_status === 'approved').length;
  const approvedPharmacies = pharmacies.filter(p => p.verification_status === 'approved').length;

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#ecfeff', borderRadius: '6px', color: '#0891b2', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <TrendingUp size={16} /> Operational Analytics & Trends
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            Platform Performance & Growth
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Real SQL-derived metrics across patient consultations, pharmacy orders, revenue, and onboarding velocity.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
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
          Refresh Data
        </button>
      </div>

      {/* Top Aggregates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Marketplace Gross Volume</span>
            <DollarSign size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', marginTop: '10px' }}>
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {orders.length} total orders placed
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Consultation Sessions</span>
            <Activity size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', marginTop: '10px' }}>
            {appointments.length}
          </div>
          <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '4px', fontWeight: '600' }}>
            {completedAppts} encounters completed
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Approved Physicians</span>
            <Stethoscope size={18} color="#0a4bb5" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0a4bb5', marginTop: '10px' }}>
            {approvedDoctors}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Out of {doctors.length} registered doctors
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Verified Dispensaries</span>
            <Store size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '10px' }}>
            {approvedPharmacies}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Out of {pharmacies.length} retail stores
          </div>
        </div>
      </div>

      {/* Analytical Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Appointments Funnel */}
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="#2563eb" /> Teleconsultation Encounter Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#15803d' }}>Completed Encounters</span>
                <span>{completedAppts} ({appointments.length ? Math.round((completedAppts / appointments.length) * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#16a34a', width: `${appointments.length ? (completedAppts / appointments.length) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#b45309' }}>Scheduled / Pending</span>
                <span>{pendingAppts} ({appointments.length ? Math.round((pendingAppts / appointments.length) * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#d97706', width: `${appointments.length ? (pendingAppts / appointments.length) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#b91c1c' }}>Cancelled Slots</span>
                <span>{cancelledAppts} ({appointments.length ? Math.round((cancelledAppts / appointments.length) * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#dc2626', width: `${appointments.length ? (cancelledAppts / appointments.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Pharmacy Orders Breakdown */}
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} color="#059669" /> Pharmacy Fulfillment Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#15803d' }}>Fulfilled & Delivered</span>
                <span>{completedOrders} ({orders.length ? Math.round((completedOrders / orders.length) * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#059669', width: `${orders.length ? (completedOrders / orders.length) * 100 : 0}%` }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', color: '#b45309' }}>In Dispensing / Delivery</span>
                <span>{pendingOrders} ({orders.length ? Math.round((pendingOrders / orders.length) * 100) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#f59e0b', width: `${orders.length ? (pendingOrders / orders.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
