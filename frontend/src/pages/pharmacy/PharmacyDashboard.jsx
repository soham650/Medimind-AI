import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services';
import { Link } from 'react-router-dom';
import {
  Store,
  Package,
  CheckCircle2,
  Clock,
  ShoppingBag,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Truck,
  ShieldCheck,
  Bell,
  Layers,
  Search,
  ExternalLink,
  Plus
} from 'lucide-react';

export default function PharmacyDashboard() {
  const { user, profile } = useAuth();
  const [data, setData] = useState({
    orders: [],
    todayOrdersCount: 0,
    pendingOrdersCount: 0,
    acceptedOrdersCount: 0,
    readyOrdersCount: 0,
    deliveredOrdersCount: 0,
    totalInventoryItems: 0,
    lowStockCount: 0,
    expiringBatchesCount: 0,
    totalRevenue: 0,
    recentActivity: [],
    notifications: []
  });
  const [loading, setLoading] = useState(true);
  const [pharmacyInfo, setPharmacyInfo] = useState(null);

  const pharmacyId = profile?.id || user?.id;

  const loadDashboard = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const [dashData, pInfo] = await Promise.all([
        pharmacyService.getPharmacyDashboard(pharmacyId),
        pharmacyService.getPharmacyProfile(pharmacyId)
      ]);
      setData(dashData);
      setPharmacyInfo(pInfo);
    } catch (err) {
      console.error('Error fetching pharmacy dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [pharmacyId]);

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#eff6ff', color: '#1d4ed8', label: 'Confirmed' };
      case 'processing':
        return { bg: '#fef3c7', color: '#b45309', label: 'Processing' };
      case 'packed':
        return { bg: '#e0e7ff', color: '#4338ca', label: 'Packed' };
      case 'shipped':
      case 'out_for_delivery':
        return { bg: '#fae8ff', color: '#86198f', label: 'Dispatched' };
      case 'delivered':
        return { bg: '#dcfce7', color: '#15803d', label: 'Delivered' };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' };
      default:
        return { bg: '#f1f5f9', color: '#475569', label: status || 'Pending' };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0a4bb5 0%, #1e3a8a 100%)',
        borderRadius: '16px',
        padding: '28px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 4px 20px -2px rgba(10, 75, 181, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
            <Store size={15} /> LICENSED DISPENSARY PORTAL
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 6px 0' }}>
            {pharmacyInfo?.pharmacy_name || profile?.pharmacy_name || profile?.full_name || 'Medical Store Dispensary'}
          </h1>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            Drug License #{pharmacyInfo?.drug_license_number || profile?.drug_license_number || 'DL-REGISTERED'} • GSTIN: {pharmacyInfo?.gstin || '27AAACG0000A1Z5'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadDashboard}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 16px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link
            to="/pharmacy/batches"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#22c55e',
              borderRadius: '8px',
              padding: '10px 18px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            <Plus size={16} /> New Batch
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {/* Today's Orders */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Today's Orders</span>
            <Clock size={18} color="#0a4bb5" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '10px' }}>
            {data.todayOrdersCount}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            {data.pendingOrdersCount} pending acceptance
          </span>
        </div>

        {/* Processing / Dispensing */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>In Processing</span>
            <Package size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '10px' }}>
            {data.acceptedOrdersCount}
          </div>
          <Link to="/pharmacy/orders" style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            Fulfill Queue <ArrowRight size={12} />
          </Link>
        </div>

        {/* Dispatched / Ready */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Dispatched / Ready</span>
            <Truck size={18} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#7c3aed', marginTop: '10px' }}>
            {data.readyOrdersCount}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Out for delivery / pickup
          </span>
        </div>

        {/* Low Stock Alerts */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Low Stock Items</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: data.lowStockCount > 0 ? '#dc2626' : '#16a34a', marginTop: '10px' }}>
            {data.lowStockCount}
          </div>
          <Link to="/pharmacy/inventory" style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            Review Stock <ArrowRight size={12} />
          </Link>
        </div>

        {/* Expiring Batches */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Expiring Batches (90d)</span>
            <Layers size={18} color="#f97316" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: data.expiringBatchesCount > 0 ? '#f97316' : '#16a34a', marginTop: '10px' }}>
            {data.expiringBatchesCount}
          </div>
          <Link to="/pharmacy/batches" style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            FEFO Batches <ArrowRight size={12} />
          </Link>
        </div>

        {/* Revenue Realized */}
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Dispensed Revenue</span>
            <TrendingUp size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '10px' }}>
            ₹{data.totalRevenue.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            {data.deliveredOrdersCount} fulfilled prescriptions
          </span>
        </div>
      </div>

      {/* Main Content: Orders Stream & Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Recent Prescription Orders */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                Prescription Orders Queue
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Latest patient orders requiring review, packaging, and dispatch.
              </p>
            </div>
            <Link
              to="/pharmacy/orders"
              style={{
                fontSize: '13px',
                color: '#0a4bb5',
                fontWeight: '700',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              View All ({data.orders.length}) <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>Loading live orders from Supabase...</p>
            </div>
          ) : data.orders.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <ShoppingBag size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>No Orders Received Yet</h3>
              <p style={{ fontSize: '13px', margin: 0 }}>Orders placed by patients from your dispensary catalog will appear in real time.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.orders.slice(0, 6).map((order) => {
                const badge = getOrderStatusBadge(order.order_status);
                return (
                  <div
                    key={order.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{order.order_number}</strong>
                        {order.prescription?.rx_id && (
                          <span style={{ fontSize: '11px', fontFamily: 'monospace', background: '#eff6ff', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            {order.prescription.rx_id}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        Patient: <strong>{order.patient?.full_name || 'Verified Patient'}</strong> • Amount: <strong>₹{order.total_amount}</strong> ({order.payment_method?.toUpperCase()})
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: badge.bg,
                        color: badge.color
                      }}>
                        {badge.label}
                      </span>
                      <Link
                        to="/pharmacy/orders"
                        style={{
                          fontSize: '12px',
                          color: '#0a4bb5',
                          fontWeight: '600',
                          textDecoration: 'none',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff'
                        }}
                      >
                        Inspect
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Panel: Quick Actions & Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Operations Links */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 14px 0' }}>
              Dispensary Navigation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                to="/pharmacy/inventory"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Package size={16} color="#0a4bb5" /> Pharmacy Inventory
                </div>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{data.totalInventoryItems} items</span>
              </Link>

              <Link
                to="/pharmacy/batches"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Layers size={16} color="#7c3aed" /> Batch & FEFO Expiry
                </div>
                <ArrowRight size={14} color="#94a3b8" />
              </Link>

              <Link
                to="/pharmacy/medicines"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Search size={16} color="#059669" /> Master Drug Catalog
                </div>
                <ArrowRight size={14} color="#94a3b8" />
              </Link>

              <Link
                to="/pharmacy/verification"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={16} color="#d97706" /> License & Compliance
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: pharmacyInfo?.verification_status === 'approved' ? '#dcfce7' : '#fef3c7',
                  color: pharmacyInfo?.verification_status === 'approved' ? '#166534' : '#92400e'
                }}>
                  {pharmacyInfo?.verification_status?.toUpperCase() || 'VERIFIED'}
                </span>
              </Link>
            </div>
          </div>

          {/* Real-time Dispensary Alerts */}
          <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Bell size={16} color="#0a4bb5" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                Dispensary Notifications
              </h3>
            </div>

            {data.notifications.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>No unread alerts.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.notifications.slice(0, 4).map((n) => (
                  <div key={n.id} style={{ padding: '10px 12px', borderRadius: '8px', background: '#f8fafc', borderLeft: '3px solid #0a4bb5' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{n.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{n.message}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
