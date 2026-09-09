import React, { useState, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  AlertCircle, 
  ShieldCheck, 
  Clock, 
  Lock, 
  Radio, 
  User, 
  Wifi
} from 'lucide-react';

/**
 * VideoConsultationProvider
 * Production abstraction layer for telehealth video sessions.
 * Status: PENDING_INTEGRATION
 * Explicitly states provider integration status without simulating fake WebRTC video streams.
 */
export default function VideoConsultationProvider({
  appointment,
  patient,
  doctor,
  onEndConsultation,
  sessionStatus = 'in_progress'
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [micActive, setMicActive] = useState(false);
  const [camActive, setCamActive] = useState(false);
  const [connectionNotice, setConnectionNotice] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMic = () => {
    setMicActive(!micActive);
    setConnectionNotice(`Microphone hardware ${!micActive ? 'enabled' : 'muted'} (Provider abstraction).`);
    setTimeout(() => setConnectionNotice(null), 3000);
  };

  const handleToggleCam = () => {
    setCamActive(!camActive);
    setConnectionNotice(`Camera stream ${!camActive ? 'enabled' : 'disabled'} (Provider abstraction).`);
    setTimeout(() => setConnectionNotice(null), 3000);
  };

  const patientName = patient?.full_name || 'Authorized Patient';
  const patientInitials = patientName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PT';

  return (
    <div style={{
      background: '#0f172a',
      borderRadius: '14px',
      overflow: 'hidden',
      border: '1px solid #1e293b',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '360px',
      position: 'relative'
    }}>
      {/* Top Session Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#0d9488',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '700',
            padding: '3px 8px',
            borderRadius: '6px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', animation: 'pulse 2s infinite' }}></span>
            ENCRYPTED TELEHEALTH
          </span>
          <span style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} /> {formatDuration(elapsedSeconds)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#f59e0b',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '3px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Radio size={12} /> STATUS: PENDING_INTEGRATION
          </span>
        </div>
      </div>

      {/* Main Video Screen / Provider Placeholder */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff'
      }}>
        <div style={{
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: '#0f766e',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '26px',
          fontWeight: '800',
          marginBottom: '16px',
          boxShadow: '0 0 20px rgba(15, 118, 110, 0.3)',
          border: '2px solid #14b8a6'
        }}>
          {patientInitials}
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#f8fafc' }}>
          {patientName}
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
          ABHA ID: {patient?.abha_id || '91-XXXX-XXXX-XXXX'} • Appointment: {appointment?.appointment_number || 'APT-LIVE'}
        </p>

        {/* Integration Status Notice Box */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '12px 18px',
          maxWidth: '520px',
          textAlign: 'left',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontSize: '12.5px', fontWeight: '700', marginBottom: '4px' }}>
            <AlertCircle size={15} /> Video Consultation Integration Pending
          </div>
          <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
            Real-time media server bindings (WebRTC / Jitsi / Twilio) are scheduled for Phase 6 media gateway.
            Clinical encounter documentation, diagnostic assessment, and digital prescription issuance remain 
            fully active and persistent.
          </p>
        </div>

        {connectionNotice && (
          <div style={{
            fontSize: '11.5px',
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '4px 12px',
            borderRadius: '9999px',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            marginBottom: '12px'
          }}>
            {connectionNotice}
          </div>
        )}
      </div>

      {/* Bottom Control Dock */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid #1e293b',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px'
      }}>
        <button
          onClick={handleToggleMic}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: micActive ? '#0f766e' : '#334155',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          title={micActive ? 'Mute Microphone' : 'Enable Microphone'}
        >
          {micActive ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        <button
          onClick={handleToggleCam}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: camActive ? '#0f766e' : '#334155',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          title={camActive ? 'Disable Camera' : 'Enable Camera'}
        >
          {camActive ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          onClick={onEndConsultation}
          style={{
            padding: '8px 18px',
            borderRadius: '9999px',
            background: '#dc2626',
            border: 'none',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)'
          }}
        >
          <PhoneOff size={16} /> Conclude Encounter
        </button>
      </div>
    </div>
  );
}
