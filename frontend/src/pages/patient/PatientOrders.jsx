import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { orderService } from '../../services';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  FileText,
  MapPin,
  Phone,
  Store,
  ArrowLeft,
  XCircle
} from 'lucide-react';

export default function PatientOrders() {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchOrders = async () => {
    if (!user && !profile) {
      setLoading(false);
      return;
    }
    const patientId = profile?.id || user?.id;
    setLoading(true);
    setError(null);
    try {
      const data = await orderService.getPatientOrders(patientId);
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        setSelectedOrder(data[0]);
      }
    } catch (err) {
      console.error('Error loading patient orders:', err);
      setError(err.message || 'Unable to retrieve your medicine orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, profile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this medicine order?')) return;
    setCancellingId(orderId);
    try {
      await orderService.fulfillPrescriptionOrder(orderId, selectedOrder?.pharmacy_id || '00000000-0000-0000-0000-000000000000', 'cancel');
      showToast('Order successfully cancelled.');
      await fetchOrders();
    } catch (err) {
      alert('Cancellation failed: ' + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesFilter =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !['delivered', 'cancelled'].includes(o.order_status)) ||
      (statusFilter === 'completed' && o.order_status === 'delivered') ||
      (statusFilter === 'cancelled' && o.order_status === 'cancelled');

    const matchesSearch =
      (o.order_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.pharmacy?.pharmacy_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return { bg: '#dcfce7', color: '#15803d', label: 'Delivered', icon: CheckCircle2 };
      case 'out_for_delivery':
      case 'dispatched':
        return { bg: '#eff6ff', color: '#1d4ed8', label: 'Out for Delivery', icon: Truck };
      case 'packed':
      case 'dispensed':
        return { bg: '#fef3c7', color: '#b45309', label: 'Packed & Ready', icon: Package };
      case 'confirmed':
        return { bg: '#ede9fe', color: '#6d28d9', label: 'Order Confirmed', icon: Clock };
      case 'cancelled':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Cancelled', icon: XCircle };
      default:
        return { bg: '#f1f5f9', color: '#475569', label: 'Pending Processing', icon: Clock };
    }
  };

  const steps = [
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'packed', label: 'Packed' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const getStepIndex = (status) => {
    if (status === 'cancelled') return -1;
    if (status === 'delivered') return 4;
    if (status === 'out_for_delivery') return 3;
    if (status === 'dispatched') return 2;
    if (status === 'packed' || status === 'dispensed') return 1;
    if (status === 'confirmed') return 0;
    return 0;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontWeight: '700', fontSize: '13px' }}>
            <ShoppingBag size={18} /> PATIENT MEDICINE ORDERS
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Order History & Delivery Tracker
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Track prescription medication fulfillment, view digital dispensary receipts, and check delivery status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchOrders}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <Link
            to="/pharmacy"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: '#0a4bb5',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '700',
              boxShadow: '0 2px 4px rgba(10, 75, 181, 0.2)'
            }}
          >
            <Store size={16} /> Order Medicines
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['all', 'active', 'completed', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: statusFilter === tab ? '#0a4bb5' : '#f1f5f9',
                color: statusFilter === tab ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab === 'all' ? `All Orders (${orders.length})` : tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '260px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '6px 12px',
            width: '100%'
          }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by Order # or Pharmacy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                paddingLeft: '8px',
                fontSize: '13px',
                width: '100%',
                color: '#1e293b'
              }}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ padding: '60px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Retrieving your pharmacy order records...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div style={{
          padding: '24px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#991b1b',
          marginBottom: '24px'
        }}>
          <AlertCircle size={24} />
          <div>
            <h4 style={{ fontWeight: '700', fontSize: '14px' }}>Unable to load orders</h4>
            <p style={{ fontSize: '13px', color: '#b91c1c', marginTop: '2px' }}>{error}</p>
          </div>
          <button
            onClick={fetchOrders}
            style={{ marginLeft: 'auto', padding: '6px 12px', background: '#ffffff', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div style={{
          padding: '64px 24px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <Package size={56} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Medicine Orders Found</h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '8px auto 24px auto' }}>
            {searchQuery || statusFilter !== 'all'
              ? 'No orders match your active search criteria. Try clearing your filters.'
              : "You haven't placed any medicine orders yet. Browse our verified pharmacies to order prescribed medicines."}
          </p>
          <Link
            to="/pharmacy"
            style={{
              padding: '10px 24px',
              background: '#0a4bb5',
              color: '#ffffff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '700'
            }}
          >
            Browse Pharmacy Store
          </Link>
        </div>
      )}

      {/* Main Orders Layout */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', alignItems: 'start' }}>
          {/* Orders List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.order_status);
              const BadgeIcon = badge.icon;
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  style={{
                    background: '#ffffff',
                    border: isSelected ? '2px solid #0a4bb5' : '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 8px 20px -4px rgba(10, 75, 181, 0.12)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                          {order.order_number}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '700',
                          background: badge.bg,
                          color: badge.color
                        }}>
                          <BadgeIcon size={13} /> {badge.label}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                        Placed on {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                        ₹{Number(order.total_amount || 0).toFixed(2)}
                      </span>
                      <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>
                        {order.payment_method} • {order.payment_status}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    padding: '12px 14px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                    color: '#334155'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Store size={15} color="#0a4bb5" />
                      <strong>{order.pharmacy?.pharmacy_name || 'Central Dispensary'}</strong>
                    </div>
                    <span style={{ color: '#64748b' }}>
                      {order.order_items?.length || 0} item{(order.order_items?.length || 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Order Tracker Drawer */}
          {selectedOrder && (
            <div style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)',
              position: 'sticky',
              top: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    TRACKING DETAILS
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
                    {selectedOrder.order_number}
                  </h3>
                </div>
                {['pending', 'confirmed'].includes(selectedOrder.order_status) && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.id)}
                    disabled={cancellingId === selectedOrder.id}
                    style={{
                      padding: '6px 12px',
                      background: '#fee2e2',
                      color: '#b91c1c',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {cancellingId === selectedOrder.id ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}
              </div>

              {/* Visual 5-Step Delivery Stepper */}
              {selectedOrder.order_status !== 'cancelled' ? (
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '8px' }}>
                    {/* Connecting Bar */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '10px',
                      right: '10px',
                      height: '3px',
                      background: '#e2e8f0',
                      zIndex: 1
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, (getStepIndex(selectedOrder.order_status) / 4) * 100))}%`,
                        background: '#16a34a',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>

                    {steps.map((step, idx) => {
                      const isComplete = idx <= getStepIndex(selectedOrder.order_status);
                      const isCurrent = idx === getStepIndex(selectedOrder.order_status);

                      return (
                        <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isComplete ? '#16a34a' : '#ffffff',
                            border: isComplete ? '2px solid #16a34a' : '2px solid #cbd5e1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: '700'
                          }}>
                            {isComplete ? '✓' : idx + 1}
                          </div>
                          <span style={{
                            fontSize: '11px',
                            marginTop: '6px',
                            fontWeight: isCurrent ? '800' : '600',
                            color: isCurrent ? '#0f172a' : '#64748b'
                          }}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '16px',
                  background: '#fef2f2',
                  borderRadius: '10px',
                  color: '#991b1b',
                  fontSize: '13px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <XCircle size={20} />
                  <div>
                    <strong>Order Cancelled</strong>
                    <p style={{ marginTop: '2px', fontSize: '12px' }}>This order was cancelled and items were restored to pharmacy stock.</p>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Prescribed Medications
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(selectedOrder.order_items || []).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>
                          {item.medicine?.brand_name || 'Standard Medication'}
                        </strong>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          {item.medicine?.generic_name} • Qty: {item.quantity}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                        ₹{Number(item.total_price || item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address & Dispensary */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <MapPin size={16} color="#64748b" style={{ marginTop: '3px' }} />
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Delivery Destination:</span>
                    <p style={{ fontSize: '13px', color: '#0f172a', marginTop: '2px' }}>
                      {selectedOrder.delivery_address || 'Home Delivery on File'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Store size={16} color="#64748b" style={{ marginTop: '3px' }} />
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Dispensary:</span>
                    <p style={{ fontSize: '13px', color: '#0f172a', marginTop: '2px' }}>
                      {selectedOrder.pharmacy?.pharmacy_name || 'MediMind Licensed Partner'}
                    </p>
                    {selectedOrder.pharmacy?.phone && (
                      <p style={{ fontSize: '12px', color: '#64748b' }}>Contact: {selectedOrder.pharmacy.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div style={{
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '2px dashed #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Total Paid:</span>
                <span style={{ fontSize: '20px', fontWeight: '900', color: '#0a4bb5' }}>
                  ₹{Number(selectedOrder.total_amount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
