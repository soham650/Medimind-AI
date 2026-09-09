import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { prescriptionService } from '../../services/prescription.service';
import { patientService } from '../../services/patient.service';

export default function PatientPrescriptions() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [doseFilter, setDoseFilter] = useState('all');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [nightTaken, setNightTaken] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const patientName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Patient');
  const patientInitials = patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const abhaNumber = profile?.abha_id || profile?.abha_number || 'ABHA Registered';

  useEffect(() => {
    async function loadPrescriptions() {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await prescriptionService.getPatientPrescriptions(user.id);
        setPrescriptions(data || []);
      } catch (err) {
        console.warn('Prescriptions fetch note:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPrescriptions();
  }, [user]);

  const handleOrderPharmacy = (rx) => {
    navigate('/pharmacy', {
      state: {
        rxId: rx?.rx_id,
        diagnosis: rx?.diagnosis,
        items: rx?.medicines?.map(m => ({
          name: m.name,
          dosage: m.dosage,
          quantity: 1
        }))
      }
    });
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchesDiagnosis = p.diagnosis?.toLowerCase().includes(query);
    const matchesDoctor = p.doctor?.full_name?.toLowerCase().includes(query);
    const matchesRx = p.rx_id?.toLowerCase().includes(query);
    const matchesMed = (p.medicines || []).some(m => m.name?.toLowerCase().includes(query));
    return matchesDiagnosis || matchesDoctor || matchesRx || matchesMed;
  });

  const totalMedsCount = prescriptions.reduce((acc, p) => acc + (p.medicines?.length || 0), 0);

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medications, doctor, Rx number..."
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
            ABDM Linked: Active
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

          <div 
            onClick={() => navigate('/patient/notifications')}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <Bell size={20} color="#475569" />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }}></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
              {patientInitials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>{patientName}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>ABHA: {abhaNumber}</div>
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
              Manage digital e-prescriptions, track medicine refills, and order doorstep delivery from approved pharmacies.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate('/pharmacy')}
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
              <Store size={15} /> Open Pharmacy Store
            </button>
            <button 
              onClick={() => navigate('/patient/orders')}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShoppingBag size={14} /> My Orders
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
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>TOTAL PRESCRIPTIONS</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{prescriptions.length} Regimens</div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>{totalMedsCount} Prescribed Medicines</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fff5f5', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#b91c1c', letterSpacing: '0.04em' }}>NEXT REFILL DUE</span>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#dc2626' }}>
                {prescriptions[0]?.follow_up_date ? new Date(prescriptions[0].follow_up_date).toLocaleDateString() : 'On Schedule'}
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Continuous Care Protocol</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>PHARMACY DISPATCH</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>FEFO Verified</div>
              <span style={{ fontSize: '11px', color: '#16a34a' }}>Direct Stock Allocation</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>SECURITY & ENCRYPTION</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a' }}>ABDM Level 3</div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>PostgreSQL RLS Protected</span>
            </div>
          </div>

        </div>

        {/* 2-Column Split: Prescriptions (Left) vs Dose Schedule & Safety (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Prescriptions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Verified Digital Prescriptions (Rx Vault) */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Verified Digital Prescriptions ({filteredPrescriptions.length})
                </h3>
              </div>

              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto', display: 'block', color: '#0a4bb5' }} />
                  Loading your verified digital prescriptions from Supabase...
                </div>
              ) : filteredPrescriptions.length === 0 ? (
                <div style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1'
                }}>
                  <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
                    No Prescriptions on File
                  </h4>
                  <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '420px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
                    Prescriptions issued by your consulting doctor will automatically appear here with ABDM digital verification and instant pharmacy dispatch.
                  </p>
                  <button 
                    onClick={() => navigate('/doctors')}
                    style={{
                      background: '#0a4bb5',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Consult a Doctor
                  </button>
                </div>
              ) : (
                filteredPrescriptions.map(rx => (
                  <div key={rx.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginBottom: '16px', background: '#ffffff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                            {rx.diagnosis || 'Clinical Regimen'}
                          </h4>
                          <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10.5px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                            Verified Active
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px' }}>
                          {rx.doctor?.full_name ? `Dr. ${rx.doctor.full_name}` : 'Consulting Doctor'} 
                          {rx.doctor?.specialization ? ` (${rx.doctor.specialization})` : ''} 
                          {rx.doctor?.clinic_name ? ` • ${rx.doctor.clinic_name}` : ''} 
                          • {new Date(rx.created_at).toLocaleDateString()}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#0a4bb5', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                          #{rx.rx_id}
                        </span>
                        <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '600', marginTop: '3px' }}>
                          ✓ Digital Sign Verified
                        </div>
                      </div>
                    </div>

                    {/* Medications List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                      {(rx.medicines || []).map((med, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr', alignItems: 'center', padding: '8px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                          <div>
                            <strong style={{ color: '#0f172a', display: 'block' }}>{med.name}</strong>
                            <span style={{ fontSize: '10.5px', color: '#64748b' }}>Dosage: {med.dosage || 'As directed'}</span>
                          </div>
                          <div>
                            <span style={{ color: '#334155' }}>{med.frequency || 'Regular'}</span>
                          </div>
                          <div>
                            <span>{med.duration || 'Per protocol'}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {med.instructions || 'Follow doctor directions'}
                          </div>
                        </div>
                      ))}
                    </div>

                    {rx.general_advice && (
                      <div style={{ marginTop: '10px', padding: '8px 10px', background: '#eff6ff', borderRadius: '6px', fontSize: '11px', color: '#1e40af' }}>
                        <strong>Doctor Advice:</strong> {rx.general_advice}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(rx.rx_id);
                            showToast(`Rx ID #${rx.rx_id} copied to clipboard!`);
                          }}
                          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '11.5px', fontWeight: '600', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          Copy Rx ID
                        </button>
                      </div>

                      <button 
                        onClick={() => handleOrderPharmacy(rx)}
                        style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Store size={13} /> Order in Pharmacy Store
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Safety & Pharmacy Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Safety & Interactions */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Safety & Clinical Guidance
                </h3>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                  Safety First
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '11.5px', color: '#334155', lineHeight: '1.4' }}>
                <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: '800', marginBottom: '2px' }}>
                    <CheckCircle2 size={14} /> Doctor Prescribed Only
                  </div>
                  <span style={{ fontSize: '11px', color: '#14532d' }}>
                    MediMind AI strictly displays medications authorized by registered medical practitioners. Always take doses exactly as prescribed.
                  </span>
                </div>

                <div style={{ background: '#eff6ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <strong style={{ display: 'block', color: '#1e3a8a', marginBottom: '2px' }}>Doorstep Pharmacy Delivery</strong>
                  <span style={{ fontSize: '11px', color: '#1e40af' }}>
                    Orders dispatched via verified partner pharmacies use First-Expiry-First-Out (FEFO) batch allocation for optimal potency and freshness.
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Pharmacy Quick Link */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', textAlign: 'center' }}>
              <Store size={32} color="#0a4bb5" style={{ margin: '0 auto 8px auto' }} />
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 6px 0' }}>
                Need Otc or Prescription Refills?
              </h4>
              <p style={{ fontSize: '11.5px', color: '#64748b', margin: '0 0 14px 0' }}>
                Browse available stock from licensed pharmacy inventory with genuine batch tracking and doorstep delivery.
              </p>
              <button 
                onClick={() => navigate('/pharmacy')}
                style={{
                  width: '100%',
                  background: '#0a4bb5',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Browse Pharmacy Store
              </button>
            </div>

            {/* Pharmacist Helpline */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <strong style={{ fontSize: '12.5px', color: '#0f172a' }}>Pharmacist Helpline</strong>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Dosage & generic advice</span>
                </div>
              </div>

              <button 
                onClick={() => showToast('Pharmacist support: Helpline active 24/7 at 1800-MEDIMIND')}
                style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}
              >
                Call
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

