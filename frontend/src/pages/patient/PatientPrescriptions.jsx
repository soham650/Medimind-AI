import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Bell, 
  ShieldCheck, 
  AlertTriangle, 
  Pill, 
  Clock, 
  Store, 
  Wallet, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  UploadCloud, 
  MessageSquare, 
  Check, 
  ExternalLink,
  ChevronRight,
  Eye,
  CreditCard,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescription.service';

export default function PatientPrescriptions() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('active');
  const [doseFilter, setDoseFilter] = useState('all');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [refillQty, setRefillQty] = useState(1);
  const [nightTaken, setNightTaken] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [doseSchedule, setDoseSchedule] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadDoseSchedule() {
      try {
        const schedule = await prescriptionService.getDailyDoseSchedule(user?.id);
        if (schedule) setDoseSchedule(schedule);
      } catch (err) {
        console.warn('Dose schedule load note:', err);
      }
    }
    loadDoseSchedule();
  }, [user]);

  const handleToggleNightDose = async () => {
    const nextState = !nightTaken;
    setNightTaken(nextState);
    showToast(nextState ? '✓ Atorvastatin 20mg logged as taken at 10:00 PM.' : 'Dose marked pending.');
    try {
      await prescriptionService.logDoseStatus('dose-3', nextState ? 'taken' : 'pending');
    } catch (err) {
      console.warn('Dose status logging note:', err);
    }
  };


  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Patient Header Bar */}
      <div style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '520px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search medications, doctors, lab records..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              outline: 'none',
              background: '#f8fafc'
            }}
          />
        </div>

        {/* Right Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#dcfce7',
            color: '#166534',
            fontSize: '12px',
            fontWeight: '700',
            padding: '6px 12px',
            borderRadius: '9999px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
            ABHA Linked: Active
          </span>

          <button 
            onClick={() => showToast('🚨 Direct line to 108 / Emergency Responder triggered.')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              fontSize: '12px',
              fontWeight: '800',
              padding: '7px 14px',
              borderRadius: '9999px',
              cursor: 'pointer'
            }}
          >
            <span>☢</span> Call SOS
          </button>

          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={20} color="#475569" />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }}></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
              RS
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Rahul Sharma (32Y)</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>ABHA: 91-2345-6789-0123</div>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div style={{ background: '#0a4bb5', color: '#ffffff', padding: '10px 24px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Page Title and Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                ABDM RX VERIFIED VAULT
              </span>
              <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                ● HL7/FHIR Compliant
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Prescriptions & Smart Pharmacy Hub
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Manage digital e-prescriptions, track medicine refills, compare prices, and order doorstep delivery from approved pharmacies.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => showToast('1-Click Emergency Refill triggered for Atorvastatin 20mg')}
              style={{
                background: '#0a4bb5',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(10, 75, 181, 0.25)'
              }}
            >
              <span>⚡</span> 1-Click Emergency Refill
            </button>
            <button 
              onClick={() => showToast('Opening historical refill log...')}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              Refill Log
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>ACTIVE PRESC...</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>3 Regimens</div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Cardio & Meta...</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fff5f5', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#b91c1c', letterSpacing: '0.04em' }}>REFILL DUE IN</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>4 Days <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>(6 left)</span></div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Atorvastatin 2...</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>LINKED PHARM...</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>Apollo & MedPlus</div>
              <span style={{ fontSize: '11px', color: '#16a34a' }}>Verified ABDM...</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>QUARTERLY SA...</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a' }}>₹640 Saved</div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Via 100% Gen...</span>
            </div>
          </div>

        </div>

        {/* 2-Column Split: Prescriptions & Doorstep Order (Left) vs Dose Schedule & Safety (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Prescriptions List & Doorstep Checkout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Verified Digital Prescriptions (Rx Vault) */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Verified Digital Prescriptions (Rx Vault)
                </h3>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setActiveTab('active')}
                    style={{
                      background: activeTab === 'active' ? '#0a4bb5' : '#ffffff',
                      color: activeTab === 'active' ? '#ffffff' : '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Active (3)
                  </button>
                  <button
                    onClick={() => setActiveTab('archived')}
                    style={{
                      background: activeTab === 'archived' ? '#0a4bb5' : '#ffffff',
                      color: activeTab === 'archived' ? '#ffffff' : '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Archived (12)
                  </button>
                </div>
              </div>

              {/* Active Prescription Card */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                        Long-Term Maintenance & Lipid Protocol
                      </h4>
                      <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        Active Regimen
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                      Dr. Sarah Chen, MD (Cardiology) • City Heart Institute • Oct 20, 2024
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#0a4bb5', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                      #RX-2025-09192
                    </span>
                    <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '600', marginTop: '3px' }}>
                      ✓ Digital Sign Verified
                    </div>
                  </div>
                </div>

                {/* Medications Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                  
                  {/* Row 1: Atorvastatin */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1.2fr', alignItems: 'center', padding: '8px 10px', background: '#fff5f5', borderRadius: '6px' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Atorvastatin 20mg</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>Tablet • Antilipidemic / Statin</span>
                    </div>
                    <div>
                      <span style={{ color: '#334155' }}>Once Daily (Night)</span>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>After food</span>
                    </div>
                    <div>
                      <span>30 Days (30 tabs)</span>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>2 Refills remaining</span>
                    </div>
                    <div>
                      <span style={{ color: '#dc2626', fontWeight: '700' }}>6 tabs left</span>
                      <div style={{ width: '50px', height: '4px', background: '#fee2e2', borderRadius: '2px', marginTop: '3px' }}>
                        <div style={{ width: '20%', height: '100%', background: '#dc2626', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                    <div>
                      <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                        Refill Recommended
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Metoprolol */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1.2fr', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Metoprolol Succinate ER 25mg</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>Tablet • Beta-Blocker</span>
                    </div>
                    <div>
                      <span style={{ color: '#334155' }}>1 Tab Morning</span>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>After breakfast</span>
                    </div>
                    <div>
                      <span>30 Days (30 tabs)</span>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>3 refills remaining</span>
                    </div>
                    <div>
                      <span style={{ color: '#16a34a', fontWeight: '700' }}>24 tabs left</span>
                      <div style={{ width: '50px', height: '4px', background: '#dcfce7', borderRadius: '2px', marginTop: '3px' }}>
                        <div style={{ width: '80%', height: '100%', background: '#16a34a', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                    <div>
                      <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        In Stock
                      </span>
                    </div>
                  </div>

                  {/* Row 3: CoQ10 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1.2fr', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <div>
                      <strong style={{ color: '#0f172a', display: 'block' }}>Coenzyme Q10 100mg</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>Softgel Capsule • Cellular Support</span>
                    </div>
                    <div>
                      <span style={{ color: '#334155' }}>1 Cap Afternoon</span>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>With lunch</span>
                    </div>
                    <div>
                      <span>30 Days (30 caps)</span>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>1 Refill remaining</span>
                    </div>
                    <div>
                      <span style={{ color: '#16a34a', fontWeight: '700' }}>19 caps left</span>
                      <div style={{ width: '50px', height: '4px', background: '#dcfce7', borderRadius: '2px', marginTop: '3px' }}>
                        <div style={{ width: '63%', height: '100%', background: '#16a34a', borderRadius: '2px' }}></div>
                      </div>
                    </div>
                    <div>
                      <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                        In Stock
                      </span>
                    </div>
                  </div>

                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => showToast('Downloading Signed Digitally Validated PDF')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '11.5px', fontWeight: '600', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={13} /> Download Signed Digitally Validated PDF
                    </button>
                    <button 
                      onClick={() => showToast('Doctor refill request sent to Dr. Sarah Chen')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '11.5px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                    >
                      Request Doctor Refill
                    </button>
                  </div>

                  <button 
                    onClick={() => showToast('Order Full Prescription items queued for Apollo Pharmacy')}
                    style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Order Full Prescription
                  </button>
                </div>
              </div>

              {/* Archived Accordion */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>Acute Respiratory Regimen</strong>
                    <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                      COMPLETED / ARCHIVED
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Dr. Arjun Mehta, Pulmonology • June 14, 2024 • Azithromycin 500mg, Montelukast 10mg (Course Finished)
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><Eye size={13} /></button>
                  <button style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}><RefreshCw size={13} /></button>
                </div>
              </div>
            </div>

            {/* Doorstep Medicine Order & Instant Dispatch */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Doorstep Medicine Order & Instant Dispatch
                </h3>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '9999px' }}>
                  Express 2-Hour Delivery
                </span>
              </div>

              {/* Pharmacy Selector */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>Apollo Pharmacy - Bellandur Central</strong>
                      <span style={{ fontSize: '11px', color: '#eab308', fontWeight: '700' }}>★ 4.9</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      0.8 km away • In-Stock Guarantee (All 3 items matched)
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => showToast('Pharmacy selector modal opened')}
                  style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}
                >
                  Change Pharmacy
                </button>
              </div>

              {/* Required Refill Item */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  REQUIRED REFILL ITEMS (1 ITEM)
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>Atorvastatin 20mg</strong>
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>(Pack of 30 tabs • 1 Month Supply)</span>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                        ✓ Verified Generic Sub: Lipikind 20 (Mankind)
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                        Prescribed Brand: Atorva 20 (Zydus)
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                      ✓ 100% Bio-Equivalent
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '6px' }}>
                      <button 
                        onClick={() => setRefillQty(Math.max(1, refillQty - 1))}
                        style={{ border: 'none', background: '#f8fafc', padding: '3px 8px', cursor: 'pointer', fontWeight: 'bold' }}
                      >-</button>
                      <span style={{ padding: '0 8px', fontSize: '12px', fontWeight: '700' }}>{refillQty}</span>
                      <button 
                        onClick={() => setRefillQty(refillQty + 1)}
                        style={{ border: 'none', background: '#f8fafc', padding: '3px 8px', cursor: 'pointer', fontWeight: 'bold' }}
                      >+</button>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '15px', color: '#0f172a' }}>₹{210 * refillQty}</strong>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', display: 'block' }}>MRP ₹300</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={16} color="#0a4bb5" />
                  <div>
                    <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f172a' }}>DELIVERY DESTINATION: <span style={{ color: '#0a4bb5' }}>Home (Default)</span></div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103 • +91 98450 12345</span>
                  </div>
                </div>
                <button 
                  onClick={() => showToast('Address manager opened')}
                  style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}
                >
                  Change
                </button>
              </div>

              {/* Pricing Breakdown */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#334155', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Medicine Subtotal (1 item)</span>
                  <span>₹210</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                  <span>✓ ABDM Generic Incentive & Subsidy</span>
                  <span>-₹30</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Express 2-Hour Doorstep Delivery</span>
                  <span style={{ color: '#16a34a', fontWeight: '700' }}>FREE <span style={{ background: '#dcfce7', padding: '1px 4px', borderRadius: '3px', fontSize: '10px' }}>Free offer</span></span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '4px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', display: 'block' }}>TOTAL PAYABLE AMOUNT</span>
                    <strong style={{ fontSize: '20px', fontWeight: '900', color: '#0f172a' }}>₹180</strong>
                  </div>
                  <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700' }}>
                    You save ₹120 on this order
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button 
                onClick={() => showToast('Order confirmed! Express 2-Hour delivery dispatched via Apollo Pharmacy.')}
                style={{
                  width: '100%',
                  background: '#0a4bb5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '13px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 4px rgba(10, 75, 181, 0.25)'
                }}
              >
                <CreditCard size={16} /> Proceed to Secure 1-Click Payment (UPI / Card / Cash on Delivery)
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>
                <span>🔒 256-Bit Encrypted Checkout</span>
                <span>↺ Automated Refill Tracking Sync</span>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: Dose Schedule, Safety Interactions, OCR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Today's Dose Schedule */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Today's Dose Schedule
                </h3>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['All', 'Morn', 'Night'].map(f => (
                    <button
                      key={f}
                      onClick={() => setDoseFilter(f.toLowerCase())}
                      style={{
                        background: doseFilter === f.toLowerCase() ? '#0a4bb5' : '#f8fafc',
                        color: doseFilter === f.toLowerCase() ? '#ffffff' : '#64748b',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10.5px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Doses */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>Metoprolol Succinate 25mg</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>08:30 AM • Taken on time</span>
                    </div>
                  </div>
                  <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                    Logged
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={14} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>CoQ10 100mg Capsule</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>01:45 PM • Taken with lunch</span>
                    </div>
                  </div>
                  <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                    Logged
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: nightTaken ? '#f8fafc' : '#eff6ff', borderRadius: '8px', border: nightTaken ? '1px solid #e2e8f0' : '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: nightTaken ? '#dcfce7' : '#dbeafe', color: nightTaken ? '#166534' : '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {nightTaken ? <Check size={14} /> : <Clock size={14} />}
                    </div>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>Atorvastatin 20mg</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>10:00 PM • Tonight - In 2 hours</span>
                    </div>
                  </div>
                  {nightTaken ? (
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                      ✓ Taken
                    </span>
                  ) : (
                    <button 
                      onClick={handleToggleNightDose}
                      style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '4px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Mark Taken
                    </button>
                  )}
                </div>

              </div>

              {/* WhatsApp & App Reminders toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px', fontSize: '11.5px', color: '#334155' }}>
                <span>WhatsApp & App Reminders</span>
                <input 
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                />
              </div>
            </div>

            {/* Safety & Interactions */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Safety & Interactions
                </h3>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                  100% Safe
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: '800', marginBottom: '2px' }}>
                    <CheckCircle2 size={14} /> Zero Drug-to-Drug Conflicts Found
                  </div>
                  <span style={{ fontSize: '11px', color: '#14532d' }}>
                    MediMind AI cross-checked your current lipid & cardiac regimen against 4,800 clinical protocols. No contraindications detected.
                  </span>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', color: '#0f172a' }}>Known Allergy Check</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Patient has registered <strong>Penicillin Allergy</strong>. Prescribed medications contain zero beta-lactams.
                  </span>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                  <strong style={{ display: 'block', color: '#0f172a' }}>Dietary Guidance</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Avoid heavy grapefruit juice consumption within 4 hours of taking Atorvastatin.
                  </span>
                </div>
              </div>
            </div>

            {/* Digitize Paper Prescription (OCR) */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Digitize Paper Prescription
                </h3>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                  AI OCR V3.2
                </span>
              </div>

              <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>
                Have a handwritten clinic prescription? Drag and drop below or take a picture to automatically parse medicines into your profile.
              </p>

              {/* Upload Dropzone */}
              <div 
                onClick={() => showToast('Document picker opened for OCR Prescription parsing')}
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}
              >
                <UploadCloud size={28} color="#0a4bb5" style={{ margin: '0 auto 8px auto' }} />
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>Click to upload or drag doctor slip</div>
                <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>Supports PDF, PNG, JPG (Up to 15MB)</span>
              </div>

              <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '8px' }}>
                🔒 ABDM Health Locker encryption applied upon upload.
              </span>
            </div>

            {/* Pharmacist Helpline */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Pharmacist Helpline</strong>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Free dosage & generic advice</span>
                </div>
              </div>

              <button 
                onClick={() => showToast('Pharmacist live chat connecting...')}
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}
              >
                Chat Now
              </button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          marginTop: '32px',
          paddingTop: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div>
            © 2025 MediMind AI Healthcare. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#16a34a" /> ABDM M3 Certified
            </span>
            <span>HIPAA & ISO 27001 Compliant</span>
            <span>Security Audits Passed</span>
            <span>Emergency Contacts</span>
          </div>
        </div>

      </div>
    </div>
  );
}
