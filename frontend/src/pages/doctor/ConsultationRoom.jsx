import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Video, 
  Mic, 
  MicOff, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  Camera, 
  Activity, 
  FileText, 
  Search, 
  Bell, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  X, 
  Sparkles, 
  ChevronRight,
  Heart,
  Send,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { consultationService } from '../../services/consultation.service';

export default function ConsultationRoom() {
  const { appointmentId } = useParams();
  const { profile } = useAuth();

  const [inCall, setInCall] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [activeSoapTab, setActiveSoapTab] = useState('S');
  const [toastMessage, setToastMessage] = useState(null);

  const [clinicalNotes, setClinicalNotes] = useState(
    'Patient presents with mild dizziness on postural transition. No orthostatic hypotension documented. Suggestive of secondary autonomic dysregulation post-viral syndrome.'
  );

  const [medicines, setMedicines] = useState([
    { id: 1, name: 'Telmisartan 40mg', type: 'Tablet | Oral', schedule: '1 tab OD (After breakfast)', duration: '30 Days', refills: 'Refills: 2 Allowed' },
    { id: 2, name: 'Metoprolol Succinate ER 25mg', type: 'Tablet | Oral', schedule: '1 tab OD (At bedtime)', duration: '15 Days', refills: 'Refills: 1 Allowed' },
    { id: 3, name: 'Coenzyme Q10 + Multivitamin', type: 'Capsule | Oral', schedule: '1 cap OD (With lunch)', duration: '30 Days', refills: 'No Refill' }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSignDsc = async () => {
    showToast('Cryptographically signing encounter with DSC Clinician Token...');
    try {
      const res = await consultationService.signConsultationDsc(
        appointmentId,
        profile?.id || '00000000-0000-0000-0000-000000000000',
        {
          subjective: clinicalNotes,
          objective: 'BP 118/74, Pulse 72, O2 98%',
          assessment: 'Post-viral autonomic lability',
          plan: medicines.map(m => m.name).join(', ')
        }
      );
      if (res?.success) {
        showToast(`✓ Encounter Signed! DSC Token: ${res.dsc_token}`);
      }
    } catch (err) {
      showToast(`Signing notice: ${err.message}`);
    }
  };

  const removeMed = (id) => {
    setMedicines(prev => prev.filter(m => m.id !== id));
  };

  const addQuickMed = (name, type = 'Tablet | Oral') => {
    setMedicines(prev => [
      ...prev,
      { id: Date.now(), name, type, schedule: '1 tab OD (After meals)', duration: '30 Days', refills: 'Refills: 1 Allowed' }
    ]);
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* Top Clinical Header Bar */}
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
        <div style={{ position: 'relative', flex: 1, maxWidth: '600px' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text"
            placeholder="Search patients, MRN, lab orders, or clinical protocols..."
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
          <span style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '11px',
            fontWeight: '600',
            color: '#94a3b8',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '2px 5px'
          }}>⌘K</span>
        </div>

        {/* Right Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
            Cloud Sync: Active
          </span>

          <button 
            onClick={() => showToast('🚨 Code Blue Protocol broadcasted.')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fca5a5',
              fontSize: '12px',
              fontWeight: '700',
              padding: '6px 14px',
              borderRadius: '9999px',
              cursor: 'pointer'
            }}
          >
            <span>☢</span> Code Blue Alert
          </button>

          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={20} color="#475569" />
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#dc2626', borderRadius: '50%' }}></span>
          </div>

          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px' }}>
            SC
          </div>
        </div>
      </div>

      {toastMessage && (
        <div style={{ background: '#0a4bb5', color: '#ffffff', padding: '10px 24px', fontSize: '13px', fontWeight: '700', textAlign: 'center' }}>
          {toastMessage}
        </div>
      )}

      {/* Main Container */}
      <div style={{ padding: '20px 24px', maxWidth: '1440px', margin: '0 auto' }}>
        
        {/* Patient Status Header Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#0a4bb5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '16px',
              border: '1px solid #bfdbfe'
            }}>
              PN
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Priya Nair</h2>
                <span style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>38Y, Female</span>
                <span style={{ fontSize: '12px', color: '#0a4bb5', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>Blood Group: B+</span>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                  Routine Follow-up & Post-Viral
                </span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span><strong>ABHA ID:</strong> 91-4492-1082-7712</span>
                <span>•</span>
                <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                  <Lock size={12} /> Live Encrypted Session (WebRTC HD)
                </span>
                <span>•</span>
                <span style={{ color: '#0a4bb5', fontWeight: '800' }}>14:36</span>
              </div>
            </div>
          </div>

          {/* Real-Time Patient Vitals */}
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Heart size={18} color="#dc2626" />
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', display: 'block' }}>HEART RATE</span>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>78 <span style={{ fontSize: '11px', fontWeight: 'normal' }}>bpm</span></strong>
              </div>
            </div>

            <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} color="#dc2626" />
              <div>
                <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: '700', display: 'block' }}>BLOOD PRESSURE</span>
                <strong style={{ fontSize: '13px', color: '#dc2626' }}>138/88 <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#b91c1c' }}>Mildly High</span></strong>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Activity size={18} color="#0284c7" />
              <div>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', display: 'block' }}>SPO2</span>
                <strong style={{ fontSize: '13px', color: '#0f172a' }}>99% <span style={{ fontSize: '10.5px', color: '#16a34a' }}>Normal</span></strong>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Split: Telehealth Video + Ambient Scribe (Left) vs ABDM Rx Pad (Right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '20px' }}>
          
          {/* LEFT: Video Stream & Ambient Clinical Scribe */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Video Call Window */}
            <div style={{
              position: 'relative',
              background: '#090d16',
              borderRadius: '14px',
              height: '340px',
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.15)'
            }}>
              {/* Simulated Patient Video Stream */}
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#3b82f6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', margin: '0 auto 12px auto' }}>
                    PN
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Priya Nair</h4>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>WebRTC HD Video Stream Active</span>
                </div>
              </div>

              {/* Top Overlays */}
              <div style={{ position: 'absolute', top: '12px', left: '14px', display: 'flex', gap: '8px' }}>
                <span style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#ffffff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444' }}></span>
                  HD • 60 FPS • 128 kbps OPUS
                </span>
                <span style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', color: '#60a5fa', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
                  ABDM Tele-Verified
                </span>
              </div>

              {/* PiP Doctor Window */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                width: '130px',
                height: '95px',
                background: '#1e293b',
                borderRadius: '10px',
                border: '2px solid rgba(255,255,255,0.2)',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', margin: '0 auto 4px auto' }}>
                    SC
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#e2e8f0' }}>Dr. Sarah Chen (You)</span>
                </div>
              </div>

              {/* Floating Bottom Call Controls */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(8px)',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <button 
                  onClick={() => setMicOn(!micOn)}
                  style={{ background: micOn ? 'rgba(255,255,255,0.15)' : '#dc2626', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {micOn ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
                <button 
                  onClick={() => setCamOn(!camOn)}
                  style={{ background: camOn ? 'rgba(255,255,255,0.15)' : '#dc2626', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  {camOn ? <Video size={16} /> : <VideoOff size={16} />}
                </button>
                <button 
                  onClick={() => showToast('Screen sharing activated')}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Monitor size={16} />
                </button>
                <button 
                  onClick={() => showToast('Snapshot saved to clinical encounter record')}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Camera size={16} />
                </button>
                <button 
                  onClick={() => { setInCall(false); showToast('Teleconsultation concluded. Encrypted notes committed to EHR.'); }}
                  style={{ background: '#dc2626', border: 'none', padding: '8px 16px', borderRadius: '9999px', color: '#ffffff', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <PhoneOff size={15} /> End
                </button>
              </div>
            </div>

            {/* Audio Waveform Bar */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                <Activity size={15} color="#16a34a" /> PATIENT AUDIO CHANNEL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {[14, 28, 42, 20, 36, 12, 40, 24, 32, 18, 22].map((h, idx) => (
                  <span key={idx} style={{ width: '3px', height: `${h * 0.4}px`, background: '#16a34a', borderRadius: '2px' }}></span>
                ))}
              </div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a' }}>Active Speech</span>
            </div>

            {/* Ambient Clinical Scribe */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#0a4bb5" />
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      Ambient Clinical Scribe
                    </h3>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>ICD-10 & SNOMED CT AUTO-TAGGING</span>
                  </div>
                </div>
                <span style={{ background: '#dcfce7', color: '#166534', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '4px' }}>
                  ● NLP Sync 98.6%
                </span>
              </div>

              {/* Transcript Speech Bubble Box */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', fontSize: '12px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748b', marginBottom: '2px' }}>
                    <strong style={{ color: '#0a4bb5' }}>Dr. Sarah Chen (Attending)</strong>
                    <span>14:31:02</span>
                  </div>
                  <p style={{ margin: 0, color: '#1e293b', lineHeight: '1.4' }}>
                    "Priya, have you noticed any recurring morning headaches with these episodic dizziness episodes, or is it isolated during postural transitions?"
                  </p>
                </div>

                <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#64748b', marginBottom: '2px' }}>
                    <strong style={{ color: '#0f172a' }}>Priya Nair (Patient)</strong>
                    <span>14:31:25</span>
                  </div>
                  <p style={{ margin: 0, color: '#1e293b', lineHeight: '1.4' }}>
                    "No throbbing headaches doctor, but sudden sitting-to-standing feels dizzy. Also I had mild heart palpitations while climbing stairs yesterday afternoon."
                  </p>
                </div>
              </div>

              {/* Real-Time Extracted Entities */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#64748b', display: 'block', marginBottom: '8px', letterSpacing: '0.04em' }}>
                  REAL-TIME EXTRACTED ENTITIES
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: '800', display: 'block' }}>SYMPTOMS (SNOMED)</span>
                    <strong style={{ fontSize: '11.5px', color: '#1e293b' }}>Dizziness (mild, episodic), Palpitations</strong>
                  </div>
                  <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#b91c1c', fontWeight: '800', display: 'block' }}>ALLERGIES (VERIFIED)</span>
                    <strong style={{ fontSize: '11.5px', color: '#991b1b' }}>Penicillin: Severe (Hives)</strong>
                  </div>
                  <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', padding: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#6d28d9', fontWeight: '800', display: 'block' }}>DIFFERENTIAL DIAGNOSIS</span>
                    <strong style={{ fontSize: '11.5px', color: '#4c1d95' }}>Secondary HTN (87% Conf.)</strong>
                  </div>
                </div>
              </div>

              {/* SOAP Notes Container */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['Subjective (S)', 'Objective (O)', 'Assessment (A)', 'Plan (P)'].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveSoapTab(tab[0])}
                        style={{
                          background: activeSoapTab === tab[0] ? '#0a4bb5' : '#ffffff',
                          color: activeSoapTab === tab[0] ? '#ffffff' : '#475569',
                          border: '1px solid #cbd5e1',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      setClinicalNotes(prev => prev + '\n[AI Generated]: Patient experiences episodic postural lightheadedness and exertional palpitations without overt syncope.');
                      showToast('AI Clinical Summary synthesized into SOAP note');
                    }}
                    style={{
                      background: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    <Sparkles size={12} /> Insert AI Summary
                  </button>
                </div>

                <textarea
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Doctor's clinical notes..."
                  style={{
                    width: '100%',
                    height: '90px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    color: '#1e293b',
                    outline: 'none',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#94a3b8', marginTop: '6px' }}>
                  <span>Voice typing enabled • Auto-saving to FHIR Encounter resource</span>
                  <span style={{ color: '#16a34a', fontWeight: '700' }}>FHIR R4 Synthesized</span>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT: ABDM Digital Rx Pad & Labs Order */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Rx Pad Card */}
            <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0a4bb5', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px' }}>
                    ℞
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                      ABDM Digital Rx Pad
                    </h3>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>M3 CERTIFIED ENGINE</span>
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#475569', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                  RxID: 2025-08192-DEL
                </span>
              </div>

              {/* Drug Safety Alert Guard Banner */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#16a34a" />
                <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: '1.35' }}>
                  <strong>Drug Safety & Allergy Guard Active:</strong> 0 High-Risk Drug-Drug interactions detected. Verified against patient's Penicillin allergy profile.
                </div>
              </div>

              {/* Prescribed Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {medicines.map((med) => (
                  <div key={med.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{med.name}</strong>
                      <button 
                        onClick={() => removeMed(med.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748b', display: 'block', marginTop: '1px' }}>{med.type}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: '#334155' }}>
                      <span style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{med.schedule}</span>
                      <span style={{ color: '#16a34a', fontWeight: '700' }}>{med.duration}</span>
                      <span style={{ color: '#64748b' }}>{med.refills}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Medicine Search input */}
              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text"
                  placeholder="+ Search Pharmacopeia / Generic / Brand..."
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 32px',
                    borderRadius: '6px',
                    border: '1px dashed #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    background: '#f8fafc'
                  }}
                />
              </div>

              {/* Quick Select Meds */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: '700' }}>Quick Select:</span>
                {['+ Amlodipine 5mg', '+ Atorvastatin 10mg', '+ Pantoprazole 40mg'].map((q) => (
                  <button
                    key={q}
                    onClick={() => addQuickMed(q.replace('+ ', ''))}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#0a4bb5',
                      cursor: 'pointer'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Laboratory & Diagnostics Order */}
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>
                    LABORATORY & DIAGNOSTICS ORDER
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: '700' }}>Pathology Connected</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: '#334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span>Serum Electrolytes (Na+, K+, Cl-)</span>
                    <span style={{ color: '#64748b', fontSize: '10.5px' }}>Fasting</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span>Lipid Panel Complete (Fasting)</span>
                    <span style={{ color: '#64748b', fontSize: '10.5px' }}>Fasting</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span>2D Echocardiography & Color Doppler</span>
                    <span style={{ color: '#0a4bb5', fontSize: '10.5px', fontWeight: '700' }}>Cardio Dept</span>
                  </div>
                </div>

                <span style={{ fontSize: '10.5px', color: '#16a34a', display: 'block', marginTop: '6px' }}>
                  ✓ Auto-scheduled for tomorrow at 08:00 AM (Home Sample Collection Opted)
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={handleSignDsc}
                  style={{
                    width: '100%',
                    background: '#0a4bb5',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '11px',
                    fontSize: '13px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(10, 75, 181, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ShieldCheck size={16} /> Sign with Digital Clinician Token (DSC)
                </button>

                <button 
                  onClick={() => showToast('Prescription dispatched to Priya Nair ABHA Health Locker and SMS notification sent.')}
                  style={{
                    width: '100%',
                    background: '#eff6ff',
                    color: '#0a4bb5',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Send size={14} /> Send Rx to ABHA Health Locker & SMS
                </button>
              </div>

            </div>

            {/* Next in Queue Card */}
            <div style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => showToast('Next patient Rajesh Kumar queued for check-in.')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
                  RK
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', display: 'block' }}>NEXT IN QUEUE (WAITING IN LOBBY)</span>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Rajesh Kumar • Post-Op Cardiac Follow-up</strong>
                </div>
              </div>
              <ChevronRight size={18} color="#94a3b8" />
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
            © 2025 MediMind Clinical Intelligence Engine. All clinical decisions subject to physician sign-off.
          </div>
          <div style={{ display: 'flex', gap: '18px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={13} color="#16a34a" /> HIPAA Encrypted
            </span>
            <span>FHIR R4 v4.0.1</span>
            <span>SOC2 Type II Certified</span>
            <span>Emergency Protocols</span>
          </div>
        </div>

      </div>
    </div>
  );
}
