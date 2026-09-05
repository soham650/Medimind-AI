import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services/pharmacyService';
import { ShoppingBag, CheckCircle, Clock, Truck, FileText, Search } from 'lucide-react';

export default function OrderProcessing() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await pharmacyService.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, delivery_status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
          5. Prescription Order Processing & Dispensation
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Verify attached digital Rx IDs, dispense prescribed pharmaceuticals, and update delivery status.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1fr 400px' : '1fr', gap: '20px' }}>
        {/* Orders Table */}
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading orders queue...</div>
          ) : orders.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
              <ShoppingBag size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>No prescription orders in queue</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Patients who select your pharmacy during checkout will appear here.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px' }}>Order #</th>
                  <th style={{ padding: '12px 16px' }}>Patient</th>
                  <th style={{ padding: '12px 16px' }}>Rx Reference</th>
                  <th style={{ padding: '12px 16px' }}>Amount</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                      {order.order_number}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {order.patient?.full_name || 'Patient'}
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{order.patient?.mobile}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {order.prescription?.rx_id ? (
                        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0a4bb5' }}>
                          {order.prescription.rx_id}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>OTC / Direct</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>
                      ₹{order.total_amount}
                      <span style={{ fontSize: '11px', fontWeight: '400', color: '#64748b', display: 'block' }}>
                        {order.payment_method.toUpperCase()} ({order.payment_status})
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: order.delivery_status === 'completed' ? '#dcfce7' : '#fef3c7',
                        color: order.delivery_status === 'completed' ? '#166534' : '#92400e'
                      }}>
                        {order.delivery_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #0a4bb5',
                          background: '#eff6ff',
                          color: '#0a4bb5',
                          fontWeight: '700',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected Order Detail Sidebar */}
        {selectedOrder && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Order Details</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedOrder.order_number}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              <div><strong>Delivery Address:</strong> {selectedOrder.delivery_address || 'Patient Pickup at Store'}</div>
              <div><strong>Payment:</strong> {selectedOrder.payment_method.toUpperCase()} ({selectedOrder.payment_status})</div>
              <div><strong>Total Amount:</strong> ₹{selectedOrder.total_amount}</div>
            </div>

            {selectedOrder.prescription && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0a4bb5', fontWeight: '700', fontSize: '12px', marginBottom: '6px' }}>
                  <FileText size={14} /> Attached Digital Prescription: {selectedOrder.prescription.rx_id}
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  <strong>Diagnosis:</strong> {selectedOrder.prescription.diagnosis}
                </div>
              </div>
            )}

            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>Update Fulfillment State:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'processing')}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #f59e0b', background: '#fef3c7', color: '#b45309', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Mark Processing / Dispensing
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'ready_for_pickup')}
                style={{ padding: '8px', borderRadius: '6px', border: '1px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Ready for Pickup / Out for Delivery
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedOrder.id, 'completed')}
                style={{ padding: '8px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#ffffff', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Complete Order & Settle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
