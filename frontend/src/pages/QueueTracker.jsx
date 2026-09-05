import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Calendar, 
  Clock, 
  Users, 
  CreditCard, 
  CheckCircle, 
  Ticket,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function QueueTracker() {
  const { token } = useAuth();
  
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState('');
  const [queueStatus, setQueueStatus] = useState(null);
  
  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: '10:00 AM - 10:30 AM',
    paymentMethod: 'Razorpay'
  });

  const [bookingResult, setBookingResult] = useState(null);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [booking, setBooking] = useState(false);
  const [advancingQueue, setAdvancingQueue] = useState(false);

  // Fetch clinics
  const fetchClinics = async () => {
    try {
      const res = await fetch('/api/clinic/list');
      if (res.ok) {
        const data = await res.json();
        setClinics(data);
        if (data.length > 0) {
          setSelectedClinic(data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClinics(false);
    }
  };

  // Fetch queue status for selected clinic
  const fetchQueueStatus = async (clinicId) => {
    if (!clinicId) return;
    try {
      const res = await fetch(`/api/clinic/queue/${clinicId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQueueStatus(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      fetchQueueStatus(selectedClinic);
      // Poll queue status every 10 seconds silently
      const interval = setInterval(() => fetchQueueStatus(selectedClinic), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedClinic, token]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedClinic) return;

    setBooking(true);
    setBookingResult(null);

    try {
      const res = await fetch('/api/clinic/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          clinicId: selectedClinic,
          date: bookingForm.date,
          timeSlot: bookingForm.timeSlot,
          paymentMethod: bookingForm.paymentMethod
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingResult(data.appointment);
      fetchQueueStatus(selectedClinic);
    } catch (err) {
      alert(err.message);
    } finally {
      setBooking(false);
    }
  };

  // Demo helper: Advance the queue (simulate other patients entering consultation)
  const handleAdvanceQueue = async () => {
    if (!selectedClinic) return;
    setAdvancingQueue(true);
    try {
      const res = await fetch(`/api/clinic/queue/${selectedClinic}/advance`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchQueueStatus(selectedClinic);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdvancingQueue(false);
    }
  };

  const currentClinicInfo = clinics.find(c => c.id === selectedClinic);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="grid-2">
        
        {/* Booking Form */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }} className="text-glow-cyan">
            Book OPD Consultation
          </h3>
          
          <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Select Specialist Hospital/Clinic</label>
              {loadingClinics ? (
                <select className="form-input" disabled><option>Loading clinics...</option></select>
              ) : (
                <select 
                  className="form-input form-select" 
                  value={selectedClinic}
                  onChange={e => setSelectedClinic(e.target.value)}
                >
                  {clinics.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.speciality})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid-2" style={{ gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Preferred Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={bookingForm.date}
                  onChange={e => setBookingForm({...bookingForm, date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Preferred Time Slot</label>
                <select 
                  className="form-input form-select"
                  value={bookingForm.timeSlot}
                  onChange={e => setBookingForm({...bookingForm, timeSlot: e.target.value})}
                >
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Gateway Integration</label>
              <select 
                className="form-input form-select"
                value={bookingForm.paymentMethod}
                onChange={e => setBookingForm({...bookingForm, paymentMethod: e.target.value})}
              >
                <option value="Razorpay">Razorpay Checkout (Simulated)</option>
                <option value="Stripe">Stripe Checkout (Simulated)</option>
              </select>
            </div>

            {currentClinicInfo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Consultation Fee:</span>
                <strong style={{ color: '#06b6d4' }}>₹500 INR</strong>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '10px' }} disabled={booking}>
              <CreditCard size={16} />
              {booking ? 'Authorizing payment...' : 'Pay ₹500 & Issue Token'}
            </button>
          </form>
        </div>

        {/* Live Token & Queue Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Token Card */}
          {bookingResult && (
            <div className="glass-panel-glow" style={{ border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span className="badge badge-success">Consultation Booked</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Transaction ID: {bookingResult.transactionId}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  minWidth: '80px'
                }}>
                  <Ticket size={24} style={{ color: '#06b6d4', marginBottom: '4px' }} />
                  <span style={{ fontSize: '10px', color: '#cbd5e1' }}>OPD Token</span>
                  <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'white', lineHeight: '1.2' }}>#{bookingResult.tokenNumber}</h2>
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{bookingResult.clinicName}</h4>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{bookingResult.speciality}</span>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {bookingResult.date}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {bookingResult.timeSlot}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Queue Monitor */}
          {queueStatus && (
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }} className="text-glow-purple">Live Clinic Queue Monitor</h3>
                <span className="badge badge-success" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <Users size={12} /> {queueStatus.waitingCount} in waiting list
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Now Consulting Token</span>
                  <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#8b5cf6' }}>#{queueStatus.currentNumber}</h2>
                </div>
                {queueStatus.patientToken && (
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Your Token Position</span>
                    <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#06b6d4' }}>#{queueStatus.patientToken}</h2>
                    <span style={{ fontSize: '11px', color: '#10b981' }}>
                      {queueStatus.patientToken <= queueStatus.currentNumber 
                        ? 'It is your turn! Please enter Consultation.' 
                        : `Estimated Wait: ${(queueStatus.patientToken - queueStatus.currentNumber) * 10} mins`
                      }
                    </span>
                  </div>
                )}
              </div>

              {/* Demo advance queue button */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
                    *Demo tool: Simulate other patients finishing consultations.
                  </span>
                  <button 
                    onClick={handleAdvanceQueue}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}
                    disabled={advancingQueue}
                  >
                    <TrendingUp size={14} />
                    {advancingQueue ? 'Advancing...' : 'Advance Queue'}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
