import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services/pharmacyService';
import { Link } from 'react-router-dom';
import { Store, Package, CheckSquare, Clock, ShoppingCart, ArrowRight } from 'lucide-react';

export default function PharmacyDashboard() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadOrders();
    }
  }, [profile]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await pharmacyService.getPharmacyOrders(profile.id);
      setOrders(data);
    } catch (err) {
      console.error('Error fetching pharmacy orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingOrders = orders.filter(o => o.delivery_status === 'processing' || o.delivery_status === 'pending');
  const completedOrders = orders.filter(o => o.delivery_status === 'completed');

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>
          <Store size={18} /> APPROVED MEDICAL STORE PORTAL
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
          {profile?.pharmacy_name || profile?.name || 'Pharmacy Dispensary'}
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Drug License #{profile?.license_number || 'DL-APPROVED'} | GSTIN: {profile?.gst_number || '27AAACG0000A1Z5'}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
            <span>Orders In Processing</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#d97706', marginTop: '8px' }}>
            {pendingOrders.length}
          </div>
          <Link to="/pharmacy/orders" style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
            Fulfill Orders <ArrowRight size={12} />
          </Link>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
            <span>Completed Orders</span>
            <CheckSquare size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#16a34a', marginTop: '8px' }}>
            {completedOrders.length}
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '8px' }}>Prescriptions dispensed</span>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
            <span>Medicine Inventory</span>
            <Package size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', marginTop: '8px' }}>
            Master Catalog
          </div>
          <Link to="/pharmacy/inventory" style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
            Manage Stock <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* Quick Orders Stream */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Recent Patient Prescription Orders</h2>
          <Link to="/pharmacy/orders" style={{ fontSize: '13px', color: '#0a4bb5', fontWeight: '600', textDecoration: 'none' }}>
            View Full Queue
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>Loading store orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
            <ShoppingCart size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
            <p>No prescription orders received yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {orders.slice(0, 5).map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{o.order_number}</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    Patient: {o.patient?.full_name || 'Verified Patient'} | Total: ₹{o.total_amount}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  background: o.delivery_status === 'completed' ? '#dcfce7' : '#fef3c7',
                  color: o.delivery_status === 'completed' ? '#166534' : '#92400e'
                }}>
                  {o.delivery_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
