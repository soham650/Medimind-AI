import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Bell, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Download, 
  Calendar, 
  Phone, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Plus, 
  ChevronRight, 
  UploadCloud, 
  FlaskConical,
  Truck,
  Zap,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { labService } from '../../services/lab.service';

export default function LabDiagnostics() {
  const { user, profile } = useAuth();
  const [activePkgTab, setActivePkgTab] = useState('all');
  const [testSearch, setTestSearch] = useState('');
  const [symptomPrompt, setSymptomPrompt] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [standaloneTests, setStandaloneTests] = useState([]);
  const [liveBooking, setLiveBooking] = useState(null);

  const patientName = profile?.full_name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Patient');
  const patientInitials = patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const abhaNumber = profile?.abha_id || profile?.abha_number || 'ABHA Registered';

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadLabData() {
      try {
        const [pkgs, tests, booking] = await Promise.all([
          labService.getPackages(activePkgTab),
          labService.getStandaloneTests(testSearch),
          labService.getActiveBooking()
        ]);
        if (pkgs) setPackages(pkgs);
        if (tests) setStandaloneTests(tests);
        if (booking) setLiveBooking(booking);
      } catch (err) {
        console.warn('Lab data load note:', err);
      }
    }
    loadLabData();
  }, [activePkgTab, testSearch]);

  const handleBookPackage = async (pkg) => {
    if (!user?.id) {
      showToast('Authentication required: Please sign in to book lab tests.');
      return;
    }
    showToast(`Reserving at-home slot for ${pkg.title}...`);
    try {
      const res = await labService.bookLabTest(user.id, pkg.id, pkg.title, pkg.discounted_price);
      if (res?.success) {
        showToast(`✓ Booking Confirmed! Ref: ${res.booking_ref} | Sample Collection OTP: ${res.pickup_otp}`);
      }
    } catch (err) {
      showToast(`Booking confirmation note: ${err.message}`);
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
            placeholder="Search lab tests, medication ⌘K"
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
            onClick={() => showToast('🚨 Calling 108 Emergency Ambulance Network...')}
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
            <span>☢</span> CALL SOS / 108
          </button>

          <div style={{ position: 'relative', cursor: 'pointer' }}>
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
        
        {/* Page Title & Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
              <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                ABDM & NABL Accredited Network
              </span>
              <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '800', padding: '3px 8px', borderRadius: '4px' }}>
                SMART DIAGNOSTIC HUB
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Lab Tests, Scans & Smart Diagnostics
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
              Book NABL-accredited laboratory diagnostics with certified at-home sample collection, automated cold-chain tracking, and instant AI biomarker interpretation.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => showToast('Prescription uploader opened')}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: '600',
                color: '#334155',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UploadCloud size={15} /> Upload Prescription
            </button>
            <button 
              onClick={() => showToast('1-Click Full Body Checkup booked for home collection!')}
              style={{
                background: '#0a4bb5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 4px rgba(10, 75, 181, 0.25)'
              }}
            >
              <Zap size={15} /> 1-Click Full Body Checkup
            </button>
          </div>
        </div>

        {/* 3 Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>ACTIVE BOOKINGS</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>1 Sample in Transit (Today)</div>
              <span style={{ fontSize: '11px', color: '#0a4bb5' }}>Smart Biomarkers Engine: V4.2 ACTIVE</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>DIAGNOSTIC REPORTS</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>14 Downloadable (Vault Synced)</div>
              <span style={{ fontSize: '11px', color: '#16a34a' }}>✓ 100% Interoperable FHIR</span>
            </div>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#0a4bb5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>HEALTHPASS SAVINGS</span>
              <div style={{ fontSize: '16px', fontWeight: '800', color: '#16a34a' }}>₹1,450 Saved this Quarter</div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Subsidized via NHA Diagnostic Pool</span>
            </div>
          </div>
        </div>

        {/* Live Tracking Card */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>
                LIVE TRACKING #MM-78264: Comprehensive Metabolic Panel + Lipid Profile
              </strong>
            </div>
            <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px' }}>
              12h Fasting Protocol Active
            </span>
          </div>

          {/* Phlebotomist & OTP Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
                VR
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Vikram Rajput</strong>
                  <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '700', padding: '1px 5px', borderRadius: '3px' }}>Double Vaccinated & NABL</span>
                </div>
                <span style={{ fontSize: '11.5px', color: '#64748b' }}>Arriving Today at 07:30 AM (Sample slot: 07:30 - 08:00 AM) • Cold Chain Kit: Temp Regulated Vacutainers (4°C - 8°C)</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'block' }}>PICKUP OTP</span>
                <strong style={{ fontSize: '18px', fontWeight: '900', color: '#0a4bb5', letterSpacing: '2px' }}>4921</strong>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => showToast('Calling phlebotomist Vikram Rajput (+91 98110 44921)...')}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '11.5px', fontWeight: '700', color: '#334155', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Phone size={13} /> Call
                </button>
                <button 
                  onClick={() => showToast('Reschedule modal opened')}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '11.5px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                >
                  Reschedule
                </button>
              </div>
            </div>
          </div>

          {/* Stepper Progress */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', textAlign: 'center', position: 'relative', fontSize: '11px', color: '#64748b' }}>
            <div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}>
                <Check size={12} />
              </div>
              <strong style={{ color: '#0f172a', display: 'block' }}>Booked</strong>
              <span>08:30 PM</span>
            </div>

            <div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#16a34a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}>
                <Check size={12} />
              </div>
              <strong style={{ color: '#0f172a', display: 'block' }}>Technician Assigned</strong>
              <span>06:45 AM</span>
            </div>

            <div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto', boxShadow: '0 0 0 3px #bfdbfe' }}>
                <Truck size={12} />
              </div>
              <strong style={{ color: '#0a4bb5', display: 'block' }}>Out for Pickup</strong>
              <span style={{ color: '#0a4bb5', fontWeight: '700' }}>En Route 1.2km</span>
            </div>

            <div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}>
                <FlaskConical size={12} />
              </div>
              <strong style={{ display: 'block' }}>Sample at Lab</strong>
              <span>Est. 09:15 AM</span>
            </div>

            <div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e2e8f0', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px auto' }}>
                <Sparkles size={12} />
              </div>
              <strong style={{ display: 'block' }}>AI Analysis Ready</strong>
              <span>Est. 05:00 PM</span>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Packages & Popular Tests (Left) vs Reports & AI Suggester (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Health Packages & Individual Tests Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Curated Preventive Health Packages */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>CURATED FOR {patientName.toUpperCase()}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>
                    Preventive Health Packages & Full Diagnostics
                  </h3>
                </div>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}>
                  Compare all 24 packages →
                </span>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {['All Packages', 'Full Body Wellness', 'Cardiac & Lipid', 'Diabetes Care', 'Vitamin D...'].map((t, idx) => (
                  <button
                    key={t}
                    onClick={() => setActivePkgTab(t.toLowerCase())}
                    style={{
                      background: idx === 0 ? '#0a4bb5' : '#f8fafc',
                      color: idx === 0 ? '#ffffff' : '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* 3 Package Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                
                {/* Package 1 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '9.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>50% OFF</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>NABL Certified</span>
                    </div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', lineHeight: '1.3' }}>
                      MediMind Executive Full Body Comprehensive
                    </strong>
                    <span style={{ fontSize: '11px', color: '#0a4bb5', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                      64 Parameters • Fast 8h Turnaround
                    </span>

                    <div style={{ fontSize: '10.5px', color: '#475569', margin: '10px 0', lineHeight: '1.5' }}>
                      <div>• Complete Hemogram (CBC, ESR)</div>
                      <div>• Liver (LFT) & Kidney (KFT) Function</div>
                      <div>• Lipid Profile & HbA1c Glycated</div>
                      <div>• Vitamin D3 & Active B12 Complex</div>
                    </div>

                    <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '700', display: 'block' }}>
                      ✓ Free At-Home Certified Phlebotomy
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', textDecoration: 'line-through', display: 'block' }}>₹3,200</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>₹1,499</strong>
                    </div>
                    <button 
                      onClick={() => handleBookPackage(packages[0] || { id: 'pkg-1', title: 'Executive Full Body', discounted_price: 1499 })}
                      style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Book Test
                    </button>
                  </div>
                </div>

                {/* Package 2 */}
                <div style={{ border: '1px solid #bfdbfe', background: '#eff6ff', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ background: '#0a4bb5', color: '#ffffff', fontSize: '9.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Doctor Pick</span>
                      <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: '700' }}>Cardio Suite</span>
                    </div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', lineHeight: '1.3' }}>
                      Advanced Cardiac Risk & Lipid Screening
                    </strong>
                    <span style={{ fontSize: '11px', color: '#0a4bb5', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                      18 Parameters • Dr. Sarah Chen Recommended
                    </span>

                    <div style={{ fontSize: '10.5px', color: '#475569', margin: '10px 0', lineHeight: '1.5' }}>
                      <div>• High Sensitivity CRP (hs-CRP)</div>
                      <div>• Apolipoprotein A1 & Apo-B Ratio</div>
                      <div>• Lipid Subfractions & VLDL</div>
                      <div>• Serum Homocysteine</div>
                    </div>

                    <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '700', display: 'block' }}>
                      ✓ AI Atherosclerosis Score Included
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #bfdbfe' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', textDecoration: 'line-through', display: 'block' }}>₹1,800</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>₹999</strong>
                    </div>
                    <button 
                      onClick={() => handleBookPackage(packages[1] || { id: 'pkg-2', title: 'Cardiac Risk Screening', discounted_price: 999 })}
                      style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Book Test
                    </button>
                  </div>
                </div>

                {/* Package 3 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '9.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Routine Essential</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>Quarterly Sync</span>
                    </div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', lineHeight: '1.3' }}>
                      HbA1c & Fasting Blood Glucose Dual Monitor
                    </strong>
                    <span style={{ fontSize: '11px', color: '#0a4bb5', fontWeight: '700', display: 'block', marginTop: '2px' }}>
                      Glycemic Profile • NABL Gold Standard HPLC
                    </span>

                    <div style={{ fontSize: '10.5px', color: '#475569', margin: '10px 0', lineHeight: '1.5' }}>
                      <div>• Glycated Hemoglobin (HbA1c)</div>
                      <div>• Estimated Average Glucose (eAG)</div>
                      <div>• Plasma Glucose (Fasting)</div>
                      <div>• Urine Microalbumin Screen</div>
                    </div>

                    <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '700', display: 'block' }}>
                      ✓ Trends synced with CGM data
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8', textDecoration: 'line-through', display: 'block' }}>₹850</span>
                      <strong style={{ fontSize: '16px', color: '#0f172a' }}>₹399</strong>
                    </div>
                    <button 
                      onClick={() => handleBookPackage(packages[2] || { id: 'pkg-3', title: 'HbA1c Dual Monitor', discounted_price: 399 })}
                      style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Book Test
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Standalone Diagnostics Table */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>STANDALONE DIAGNOSTICS</span>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Popular Individual Lab Tests
                  </h3>
                </div>
                <div style={{ position: 'relative', width: '240px' }}>
                  <Search size={13} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search 400+ Individual tests..."
                    style={{
                      width: '100%',
                      padding: '6px 8px 6px 30px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '11.5px',
                      outline: 'none',
                      background: '#f8fafc'
                    }}
                  />
                </div>
              </div>

              {/* Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr', padding: '10px 14px', background: '#f8fafc', fontSize: '10.5px', fontWeight: '800', color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>
                  <span>TEST DETAILS & CODE</span>
                  <span>SAMPLE & PREP</span>
                  <span>TURNAROUND</span>
                  <span>PRICE</span>
                  <span style={{ textAlign: 'right' }}>ACTION</span>
                </div>

                {/* Row 1 */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr', padding: '12px 14px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '11.5px' }}>
                  <div>
                    <strong style={{ color: '#0f172a', display: 'block' }}>Thyroid Stimulating Hormone (TSH 3rd Gen)</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Code: MM-THY-01 • Ultra-sensitive ECLIA</span>
                  </div>
                  <div>
                    <span style={{ color: '#1e293b' }}>Serum (Blood)</span>
                    <span style={{ fontSize: '10.5px', color: '#16a34a', display: 'block' }}>No fasting needed</span>
                  </div>
                  <span style={{ color: '#475569' }}>6 hours</span>
                  <div>
                    <strong style={{ color: '#0f172a' }}>₹249</strong>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '4px' }}>₹400</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => showToast('TSH test added to cart')}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Row 2 */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr', padding: '12px 14px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '11.5px' }}>
                  <div>
                    <strong style={{ color: '#0f172a', display: 'block' }}>Vitamin D 25-Hydroxy (Total)</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Code: MM-VIT-25 • Chemiluminescent LC-MS</span>
                  </div>
                  <div>
                    <span style={{ color: '#1e293b' }}>Serum (Blood)</span>
                    <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Non-fasting</span>
                  </div>
                  <span style={{ color: '#475569' }}>12 hours</span>
                  <div>
                    <strong style={{ color: '#0f172a' }}>₹699</strong>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '4px' }}>₹1,400</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => showToast('Vitamin D test added to cart')}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Row 3 */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr', padding: '12px 14px', alignItems: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '11.5px' }}>
                  <div>
                    <strong style={{ color: '#0f172a', display: 'block' }}>Complete Urine Analysis with Microscopic Exam</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Code: MM-URN-04 • Automated Strip + Flow Cytometry</span>
                  </div>
                  <div>
                    <span style={{ color: '#1e293b' }}>Mid-stream Urine</span>
                    <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Morning sample preferred</span>
                  </div>
                  <span style={{ color: '#475569' }}>4 hours</span>
                  <div>
                    <strong style={{ color: '#0f172a' }}>₹199</strong>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '4px' }}>₹350</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => showToast('Urine Analysis added to cart')}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Row 4 */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr', padding: '12px 14px', alignItems: 'center', fontSize: '11.5px' }}>
                  <div>
                    <strong style={{ color: '#0f172a', display: 'block' }}>Lipid Profile Extended (Direct LDL, Triglycerides)</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Code: MM-LIP-08 • Enzymatic Selective Inhibition</span>
                  </div>
                  <div>
                    <span style={{ color: '#1e293b' }}>Serum (Blood)</span>
                    <span style={{ fontSize: '10.5px', color: '#dc2626', fontWeight: '600', display: 'block' }}>10-12 hrs fasting required</span>
                  </div>
                  <span style={{ color: '#475569' }}>6 hours</span>
                  <div>
                    <strong style={{ color: '#0f172a' }}>₹450</strong>
                    <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '4px' }}>₹850</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <button 
                      onClick={() => showToast('Lipid Profile Extended added to cart')}
                      style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', color: '#0a4bb5', cursor: 'pointer' }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Reports History, Copilot Test Suggester, Quality Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Diagnostic History & Reports */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Diagnostic History & Reports
                </h3>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>
                  All Records (14)
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* Report 1 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>Thyroid Stimulating Hormone (TSH) Ultra</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Oct 18, 2024 • Thyrocare Lab</span>
                    </div>
                    <span style={{ background: '#dcfce7', color: '#166534', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                      Normal (2.4 μIU/mL)
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '10.5px' }}>
                    <span style={{ color: '#16a34a' }}>✓ ABDM Vault Synced</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>PDF</button>
                      <button style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontWeight: '700', cursor: 'pointer' }}>AI Summary</button>
                    </div>
                  </div>
                </div>

                {/* Report 2 */}
                <div style={{ border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', background: '#fff5f5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>Complete Blood Count (CBC) Extended</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Sep 28, 2024 • Apollo Diagnostics</span>
                    </div>
                    <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                      Mild Anemia Flagged
                    </span>
                  </div>

                  <span style={{ fontSize: '10.5px', color: '#dc2626', display: 'block', marginTop: '4px' }}>
                    ⚠ Hb: 11.2 g/dL (Low), Ferritin: 18 ng/mL
                  </span>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #fecaca', fontSize: '10.5px' }}>
                    <span style={{ color: '#475569' }}>Doctor Review Complete</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>PDF</button>
                      <button style={{ background: '#0a4bb5', color: '#ffffff', border: 'none', borderRadius: '4px', padding: '2px 6px', fontWeight: '700', cursor: 'pointer' }}>AI Summary</button>
                    </div>
                  </div>
                </div>

                {/* Report 3 */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a' }}>12-Lead Electrocardiogram (ECG)</strong>
                      <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block' }}>Aug 15, 2024 • In-Clinic Scan</span>
                    </div>
                    <span style={{ background: '#eff6ff', color: '#1d4ed8', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>
                      Normal Sinus
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #e2e8f0', fontSize: '10.5px' }}>
                    <span style={{ color: '#16a34a' }}>✓ Verified by Cardiologist</span>
                    <button style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>PDF</button>
                  </div>
                </div>

              </div>
            </div>

            {/* MediMind Copilot NLP Engine Card */}
            <div style={{ background: '#0a4bb5', borderRadius: '14px', padding: '20px', color: '#ffffff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                  MEDIMIND COPILOT
                </span>
                <span style={{ fontSize: '10px', color: '#bfdbfe' }}>NLP Engine</span>
              </div>

              <h4 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 6px 0' }}>
                Need Help Choosing a Test?
              </h4>
              <p style={{ fontSize: '11.5px', color: '#dbeafe', lineHeight: '1.4', margin: '0 0 12px 0' }}>
                Describe what symptoms you are feeling, or let MediMind AI cross-reference your wearable biometric anomalies to recommend clinical tests.
              </p>

              <textarea 
                value={symptomPrompt}
                onChange={(e) => setSymptomPrompt(e.target.value)}
                placeholder="e.g., Feeling lethargic in the afternoons with sudden hair thinning and joint stiffness..."
                style={{
                  width: '100%',
                  height: '60px',
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  padding: '8px',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'none',
                  marginBottom: '10px'
                }}
              />

              <button 
                onClick={() => showToast('AI Analysis complete: Thyroid Panel & Vitamin D recommended.')}
                style={{
                  width: '100%',
                  background: '#ffffff',
                  color: '#0a4bb5',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={14} /> Analyze Symptoms & Suggest Tests
              </button>

              <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setSymptomPrompt('Fatigue & Low Energy in afternoons')}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Fatigue & Low Energy
                </button>
                <button 
                  onClick={() => setSymptomPrompt('Post-COVID comprehensive recovery checkup')}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#ffffff', fontSize: '10px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Post-COVID checkup
                </button>
              </div>
            </div>

            {/* Gold Standard Assurance Card */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b' }}>GOLD STANDARD ASSURANCE</span>
              <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '4px 0 12px 0' }}>
                Why MediMind Diagnostic Network?
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '11.5px', color: '#334155' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>100% NABL & CAP Accredited Labs</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Direct partnerships with Thyrocare, Dr. Lal PathLabs, Apollo Diagnostics, and Metropolis. Zero uncertified third-party processing.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Truck size={18} color="#0a4bb5" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>Cold Chain Smart Specimen Courier</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Every blood vial is preserved in IoT temperature-monitored gel packs (4°C-8°C) to prevent analyte lysis before centrifugation.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Sparkles size={18} color="#0a4bb5" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>AI Biomarker Abnormality Flagging</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Plain-English visual summaries that translate complex bio-panels into actionable nutritional, medical, and lifestyle directives.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', color: '#0f172a' }}>Instant ABHA FHIR Synchronization</strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>Standardized FHIR-compliant reports are auto-deposited into your Ayushman Bharat Health Account health locker.</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '14px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8' }}>
                <span>ISO 15189 NABL (MRL)</span>
                <span>CAP Accredited</span>
              </div>
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
