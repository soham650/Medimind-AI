import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { pharmacyService } from '../../services/pharmacy.service';
import { prescriptionService } from '../../services/prescription.service';
import { orderService } from '../../services/order.service';
import { ShoppingCart, Store, Plus, Minus, CheckCircle, FileText, CreditCard, ShieldCheck, Package, AlertCircle } from 'lucide-react';

export default function PharmacyStore() {
  const { user, isAuthenticated, loginDemo } = useAuth();
  const location = useLocation();
  const [medicines, setMedicines] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState(null);
  const [selectedRx, setSelectedRx] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Green Valley Apartments, Mumbai');
  const [orderComplete, setOrderComplete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    loadStoreData();
  }, [user]);

  const loadStoreData = async () => {
    setLoading(true);
    try {
      const [medList, pharmList, rxList] = await Promise.all([
        pharmacyService.getMedicines(),
        pharmacyService.getApprovedPharmacies(),
        user ? prescriptionService.getPatientPrescriptions(user.id) : []
      ]);
      setMedicines(medList || []);
      setPharmacies(pharmList || []);
      if (pharmList && pharmList.length > 0) setSelectedPharmacy(pharmList[0]);
      setPrescriptions(rxList || []);

      // Auto-populate cart and prescription if arriving from PatientPrescriptions with state
      if (location.state?.items && medList && medList.length > 0) {
        const prefilledCart = [];
        location.state.items.forEach(reqItem => {
          const matchedMed = medList.find(m => 
            m.brand_name.toLowerCase().includes(reqItem.name.toLowerCase()) ||
            reqItem.name.toLowerCase().includes(m.brand_name.toLowerCase()) ||
            m.generic_name?.toLowerCase().includes(reqItem.name.toLowerCase())
          );
          if (matchedMed && !prefilledCart.some(c => c.id === matchedMed.id)) {
            prefilledCart.push({ ...matchedMed, quantity: reqItem.quantity || 1 });
          }
        });
        if (prefilledCart.length > 0) {
          setCart(prefilledCart);
        }
      }

      if (location.state?.rxId && rxList) {
        const matchedRx = rxList.find(r => r.rx_id === location.state.rxId || r.id === location.state.rxId);
        if (matchedRx) setSelectedRx(matchedRx);
      }
    } catch (err) {
      console.error('Error loading store data:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (med) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === med.id);
      if (existing) {
        return prev.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...med, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.standard_price * item.quantity), 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError(null);
    if (cart.length === 0) return;
    if (!selectedPharmacy) {
      setCheckoutError('Please select an approved medical dispensary.');
      return;
    }
    if (!user?.id) {
      setCheckoutError('Authentication required: Please sign in to complete your pharmacy order.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await orderService.createOrder({
        patientId: user.id,
        pharmacyId: selectedPharmacy.id,
        prescriptionId: selectedRx?.id || null,
        items: cart.map(item => ({
          medicine_id: item.id,
          quantity: item.quantity
        })),
        deliveryAddress,
        notes: `Payment Method: ${paymentMethod.toUpperCase()}`
      });
      setOrderComplete(order);
      setCart([]);
    } catch (err) {
      console.error('Checkout failed:', err);
      setCheckoutError(err.message || 'Checkout failed. Please verify pharmacy inventory availability.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>
          <Store size={18} /> CORE SERVICE 5: PHARMACY & ORDER SERVICE
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
          Digital Pharmacy & Medicine Delivery
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Order prescribed medications and OTC health products directly from verified, licensed pharmacies.
        </p>
      </div>

      {orderComplete ? (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '2px solid #16a34a', padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
          <CheckCircle size={56} color="#16a34a" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a' }}>Order Placed Successfully!</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
            Tracking Reference: <strong style={{ color: '#0f172a' }}>{orderComplete.order_number}</strong>
          </p>
          <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', fontSize: '13px', color: '#166534', margin: '20px 0' }}>
            Fulfilling Pharmacy: <strong>{selectedPharmacy?.pharmacy_name || 'Accredited Dispensary'}</strong>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
            <Link
              to="/patient/orders"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                background: '#0a4bb5',
                color: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '13px',
                boxShadow: '0 2px 4px rgba(10, 75, 181, 0.2)'
              }}
            >
              <Package size={16} /> Track My Order & Delivery
            </Link>
            <button
              onClick={() => setOrderComplete(null)}
              style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* Medicines Catalog */}
          <div>
            {/* Pharmacy Picker */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Select Fulfilling Medical Store (Admin Approved Only):
              </label>
              <select
                value={selectedPharmacy?.id || ''}
                onChange={(e) => setSelectedPharmacy(pharmacies.find(p => p.id === e.target.value))}
                style={{ width: '100%', height: '40px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              >
                {pharmacies.length === 0 ? (
                  <option>MediMind Central Verified Dispensary</option>
                ) : (
                  pharmacies.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.pharmacy_name || p.name} ({p.address || p.pharmacy_address || 'Main Branch'})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Medicine Grid */}
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginBottom: '12px' }}>
              Available Medicines
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {medicines.map(med => (
                <div key={med.id} style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{med.brand_name}</h4>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{med.generic_name}</span>
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
                      {med.dosage_form} | {med.strength || 'Standard'}
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px', color: '#0f172a' }}>₹{med.standard_price}</strong>
                    <button
                      onClick={() => addToCart(med)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#0a4bb5',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart & Checkout Panel */}
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ShoppingCart size={20} color="#0a4bb5" />
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Your Medical Cart</h3>
            </div>

            {cart.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '24px 0' }}>
                Your cart is empty. Add items from the catalog.
              </p>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.brand_name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>₹{item.standard_price} each</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>-</button>
                        <span style={{ fontWeight: '700' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Attach Prescription if required */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Attach Verified Digital Rx (Optional / Recommended):
                  </label>
                  <select
                    value={selectedRx?.id || ''}
                    onChange={(e) => setSelectedRx(prescriptions.find(r => r.id === e.target.value))}
                    style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  >
                    <option value="">No Prescription Attached (OTC items)</option>
                    {prescriptions.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.rx_id} - {r.diagnosis}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Address */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                    Delivery Address:
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                {/* Payment method */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ padding: '8px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '11px', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <ShieldCheck size={14} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span><strong>Sandbox / Evaluation Payment:</strong> Demonstrator mode. Transactions execute transactional FEFO inventory allocation via <code>create_medicine_order_tx</code> without live credit charges.</span>
                  </div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Payment Options (Sandbox):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('online')}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: paymentMethod === 'online' ? '2px solid #0a4bb5' : '1px solid #cbd5e1',
                        background: paymentMethod === 'online' ? '#eff6ff' : '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      💳 Online UPI/Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cod')}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: paymentMethod === 'cod' ? '2px solid #0a4bb5' : '1px solid #cbd5e1',
                        background: paymentMethod === 'cod' ? '#eff6ff' : '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      💵 Cash on Delivery
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px' }}>
                  <span>Total Amount:</span>
                  <span>₹{cartTotal}</span>
                </div>

                {checkoutError && (
                  <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={15} color="#b91c1c" style={{ flexShrink: 0 }} />
                    <span>{checkoutError}</span>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Placing Order...' : 'Place Pharmacy Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
