import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Search,
  Package,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Eye,
  Check,
  Send,
  User,
  MapPin,
  Phone,
  Calendar,
  Layers,
  X
} from 'lucide-react';

export default function OrderProcessing() {
  const { user, profile } = useAuth();
  const { id: routeOrderId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Stock unavailable for one or more prescribed items');

  // Dispatch modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');

  const pharmacyId = profile?.id || user?.id;

  const loadOrders = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const data = await pharmacyService.getPharmacyOrders(pharmacyId, statusFilter);
      setOrders(data);
      if (routeOrderId) {
        const found = data.find(o => o.id === routeOrderId);
        if (found) setSelectedOrder(found);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [pharmacyId, statusFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Actions
  const handleAccept = async (order) => {
    setActionLoading(true);
    try {
      await pharmacyService.acceptOrder(order.id, pharmacyId);
      showToast(`Order #${order.order_number} accepted and moved to processing.`);
      await loadOrders();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => ({ ...prev, order_status: 'processing' }));
      }
    } catch (err) {
      alert('Accept failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (order) => {
    setSelectedOrder(order);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await pharmacyService.rejectOrder(selectedOrder.id, pharmacyId, rejectReason);
      showToast(`Order #${selectedOrder.order_number} has been rejected.`);
      setRejectModalOpen(false);
      await loadOrders();
      setSelectedOrder(prev => ({ ...prev, order_status: 'cancelled', notes: `Rejected: ${rejectReason}` }));
    } catch (err) {
      alert('Reject failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPacked = async (order) => {
    setActionLoading(true);
    try {
      await pharmacyService.markOrderPacked(order.id, pharmacyId);
      showToast(`Order #${order.order_number} marked as packed and ready for dispatch.`);
      await loadOrders();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => ({ ...prev, order_status: 'packed' }));
      }
    } catch (err) {
      alert('Action failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDispatch = (order) => {
    setSelectedOrder(order);
    setTrackingNumber(`MED-${Date.now().toString().slice(-8)}`);
    setDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await pharmacyService.fulfillOrder(selectedOrder.id, pharmacyId, trackingNumber);
      showToast(`Order #${selectedOrder.order_number} fulfilled and dispatched! Tracking: ${trackingNumber}`);
      setDispatchModalOpen(false);
      await loadOrders();
      setSelectedOrder(prev => ({ ...prev, order_status: 'shipped' }));
    } catch (err) {
      alert('Dispatch fulfillment failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkDelivered = async (order) => {
    setActionLoading(true);
    try {
      await pharmacyService.markOrderDelivered(order.id, pharmacyId);
      showToast(`Order #${order.order_number} marked as delivered.`);
      await loadOrders();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(prev => ({ ...prev, order_status: 'delivered' }));
      }
    } catch (err) {
      alert('Delivery update failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#eff6ff', color: '#1d4ed8', label: 'Confirmed (New)' };
      case 'processing':
        return { bg: '#fef3c7', color: '#b45309', label: 'Processing / Packing' };
      case 'packed':
        return { bg: '#e0e7ff', color: '#4338ca', label: 'Packed' };
      case 'shipped':
      case 'out_for_delivery':
        return { bg: '#fae8ff', color: '#86198f', label: 'Dispatched / In Transit' };
      case 'delivered':
        return { bg: '#dcfce7', color: '#15803d', label: 'Delivered' };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled' };
      default:
        return { bg: '#f1f5f9', color: '#475569', label: status || 'Pending' };
    }
  };

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    return (
      (o.order_number || '').toLowerCase().includes(term) ||
      (o.patient?.full_name || '').toLowerCase().includes(term) ||
      (o.prescription?.rx_id || '').toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1360px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <ShoppingBag size={18} /> DISPENSARY PRESCRIPTION FULFILLMENT
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Prescription Orders & Dispensation Queue
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Review digital Rx credentials, verify medication contraindications, reserve stock, and fulfill deliveries.
          </p>
        </div>

        <button
          onClick={loadOrders}
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
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh Orders
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'confirmed', label: 'Confirmed (New)' },
          { key: 'processing', label: 'In Processing' },
          { key: 'packed', label: 'Packed' },
          { key: 'shipped', label: 'Dispatched' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'cancelled', label: 'Cancelled' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              background: statusFilter === tab.key ? '#0a4bb5' : '#f1f5f9',
              color: statusFilter === tab.key ? '#ffffff' : '#475569'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Filter by Order #, Patient name, or digital Rx code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#1e293b' }}
        />
        <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
          <strong>{filteredOrders.length}</strong> orders
        </span>
      </div>

      {/* Master/Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1.4fr 1fr' : '1fr', gap: '24px' }}>
        {/* Orders Table List */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '14px', margin: 0 }}>Querying orders queue...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <ShoppingBag size={44} color="#94a3b8" style={{ margin: '0 auto 14px auto' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>No Orders Found</h3>
              <p style={{ fontSize: '13px', margin: 0 }}>No orders currently match the selected status filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                    <th style={{ padding: '14px 16px' }}>Order #</th>
                    <th style={{ padding: '14px 16px' }}>Patient</th>
                    <th style={{ padding: '14px 16px' }}>Rx Reference</th>
                    <th style={{ padding: '14px 16px' }}>Amount</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const badge = getOrderStatusBadge(order.order_status);
                    const isSelected = selectedOrder?.id === order.id;

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          background: isSelected ? '#f0f7ff' : '#ffffff'
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <strong style={{ fontSize: '14px', color: '#0f172a' }}>{order.order_number}</strong>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{order.patient?.full_name || 'Patient'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{order.patient?.phone || 'No phone'}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {order.prescription?.rx_id ? (
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0a4bb5', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                              {order.prescription.rx_id}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>Direct OTC</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: '800', color: '#0f172a' }}>₹{order.total_amount}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{order.payment_method?.toUpperCase()}</div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            background: badge.bg,
                            color: badge.color
                          }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#0a4bb5',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Order Details Panel */}
        {selectedOrder && (
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 4px 12px -2px rgba(0,0,0,0.08)',
            height: 'fit-content'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>ORDER INSPECTION</span>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={20} color="#64748b" />
              </button>
            </div>

            {/* Status & Timing */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>STATUS</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', textTransform: 'uppercase', marginTop: '2px' }}>
                  {selectedOrder.order_status?.replace(/_/g, ' ')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PLACED AT</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a', marginTop: '2px' }}>
                  {new Date(selectedOrder.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
            </div>

            {/* Patient & Delivery */}
            <div style={{ marginBottom: '18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> Patient & Delivery Address
              </h4>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                <div style={{ fontWeight: '700', color: '#0f172a' }}>{selectedOrder.patient?.full_name || 'Verified Patient'}</div>
                <div style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Phone size={12} /> {selectedOrder.patient?.phone || 'No phone recorded'}
                </div>
                <div style={{ color: '#475569', display: 'flex', alignItems: 'flex-start', gap: '4px', marginTop: '6px' }}>
                  <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} /> {selectedOrder.delivery_address || 'Clinic Counter Pickup'}
                </div>
              </div>
            </div>

            {/* Attached Prescription Details */}
            {selectedOrder.prescription && (
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} color="#0a4bb5" /> Attached Digital Prescription
                </h4>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '12px', borderRadius: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontFamily: 'monospace', color: '#1d4ed8' }}>
                      {selectedOrder.prescription.rx_id}
                    </span>
                    <span style={{ color: '#1e40af' }}>
                      Dr. {selectedOrder.prescription.doctor?.full_name || 'Practitioner'}
                    </span>
                  </div>
                  <div style={{ color: '#1e3a8a', marginBottom: '4px' }}>
                    <strong>Diagnosis:</strong> {selectedOrder.prescription.diagnosis || 'Clinical evaluation'}
                  </div>
                  {selectedOrder.prescription.instructions && (
                    <div style={{ color: '#1e3a8a' }}>
                      <strong>Advice:</strong> {selectedOrder.prescription.instructions}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prescribed / Ordered Items */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={14} /> Medication Items ({selectedOrder.order_items?.length || 0})
              </h4>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                {(selectedOrder.order_items || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderBottom: idx < selectedOrder.order_items.length - 1 ? '1px solid #f1f5f9' : 'none',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.medicine?.brand_name || 'Medicine'}</div>
                      <div style={{ color: '#64748b' }}>
                        {item.medicine?.generic_name} • Qty: <strong>{item.quantity}</strong>
                      </div>
                    </div>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                      ₹{item.total_price || (item.unit_price * item.quantity)}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: '#f8fafc', fontWeight: '800', fontSize: '13px' }}>
                  <span>Total Order Value:</span>
                  <span style={{ color: '#0a4bb5' }}>₹{selectedOrder.total_amount}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons based on order lifecycle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedOrder.order_status === 'confirmed' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleAccept(selectedOrder)}
                    disabled={actionLoading}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#0a4bb5',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <Check size={16} /> Accept & Prepare
                  </button>
                  <button
                    onClick={() => handleOpenReject(selectedOrder)}
                    disabled={actionLoading}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #fca5a5',
                      background: '#fff1f2',
                      color: '#b91c1c',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              )}

              {selectedOrder.order_status === 'processing' && (
                <button
                  onClick={() => handleMarkPacked(selectedOrder)}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#4338ca',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Package size={16} /> Mark as Packed & Sealed
                </button>
              )}

              {selectedOrder.order_status === 'packed' && (
                <button
                  onClick={() => handleOpenDispatch(selectedOrder)}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#22c55e',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={16} /> Dispatch / Fulfill Order
                </button>
              )}

              {selectedOrder.order_status === 'shipped' && (
                <button
                  onClick={() => handleMarkDelivered(selectedOrder)}
                  disabled={actionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  <CheckCircle2 size={16} /> Confirm Patient Delivery
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#b91c1c', margin: '0 0 8px 0' }}>
              Reject Prescription Order
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Please specify the reason for rejecting Order #{selectedOrder?.order_number}. The patient will be notified automatically.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoading}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#dc2626', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>
              Dispatch Medication Order
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
              Assign a courier or fulfillment tracking number to Order #{selectedOrder?.order_number}.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Tracking Reference Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  fontWeight: '700'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={actionLoading}
                style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#0a4bb5', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
              >
                {actionLoading ? 'Dispatching...' : 'Confirm Fulfillment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
