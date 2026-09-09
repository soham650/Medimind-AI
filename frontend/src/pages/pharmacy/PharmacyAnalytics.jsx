import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ShoppingBag,
  Package,
  Layers,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

export default function PharmacyAnalytics() {
  const { user, profile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const pharmacyId = profile?.id || user?.id;

  const loadAnalytics = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const data = await pharmacyService.getPharmacyAnalytics(pharmacyId);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [pharmacyId]);

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Computing live dispensary analytics from Supabase...</p>
      </div>
    );
  }

  const statusList = [
    { label: 'Pending / Confirmed', count: (analytics?.statusCounts?.pending || 0) + (analytics?.statusCounts?.confirmed || 0), color: '#3b82f6' },
    { label: 'In Processing / Workbench', count: analytics?.statusCounts?.processing || 0, color: '#f59e0b' },
    { label: 'Packed & Sealed', count: analytics?.statusCounts?.packed || 0, color: '#6366f1' },
    { label: 'Dispatched / In Transit', count: analytics?.statusCounts?.shipped || 0, color: '#ec4899' },
    { label: 'Delivered / Dispensed', count: analytics?.statusCounts?.delivered || 0, color: '#22c55e' },
    { label: 'Cancelled / Rejected', count: analytics?.statusCounts?.cancelled || 0, color: '#ef4444' }
  ];

  const totalOrders = analytics?.totalOrders || 0;

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <BarChart3 size={18} /> LIVE DISPENSARY METRICS
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Dispensary Practice & Inventory Analytics
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Authoritative transactional aggregates derived from live orders, batches, and fulfillment records.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
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
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Analytics
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Total Orders Placed</span>
            <ShoppingBag size={18} color="#0a4bb5" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '10px' }}>
            {analytics?.totalOrders || 0}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            {analytics?.statusCounts?.delivered || 0} completed deliveries
          </span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Realized Revenue</span>
            <TrendingUp size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '10px' }}>
            ₹{(analytics?.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            From fulfilled prescriptions
          </span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Inventory Valuation</span>
            <Package size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', marginTop: '10px' }}>
            ₹{(analytics?.totalInventoryValue || 0).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Total stock across {analytics?.totalInventoryBatches || 0} batches
          </span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Dispensary Batches</span>
            <Layers size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '10px' }}>
            {analytics?.totalInventoryBatches || 0}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Active FEFO lot numbers
          </span>
        </div>
      </div>

      {/* Grid: Order Status Distribution & Top Medicines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Status Distribution */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
            Prescription Orders Status Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {statusList.map((item, idx) => {
              const pct = totalOrders > 0 ? Math.round((item.count / totalOrders) * 100) : 0;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{item.label}</span>
                    <span style={{ fontWeight: '700', color: '#0f172a' }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: item.color, borderRadius: '9999px', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Dispensed Medicines */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 16px 0' }}>
            Top Dispensed Prescription Medications
          </h3>

          {!analytics?.topMedicines || analytics.topMedicines.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <Package size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '13px', margin: 0 }}>No fulfilled medication items recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analytics.topMedicines.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{m.name}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#0a4bb5' }}>
                    {m.quantity} units dispensed
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
