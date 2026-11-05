import React, { useState, useEffect, useRef } from 'react';
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
  Wifi,
  Monitor,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { WebRTCVideoProvider, CONNECTION_STATES, PEER_ROLES } from '../../services/webrtc';
import LiveKitVideoProvider from './LiveKitVideoProvider';

/**
 * VideoConsultationProvider
 * Production telehealth video provider abstraction layer.
 * Defaults to LiveKit SFU Cloud Engine with seamless fallback to Raw WebRTC.
 */
export default function VideoConsultationProvider({
  appointment,
  patient,
  doctor,
  currentUser,
  userRole = 'doctor',
  onEndConsultation = () => {},
  sessionStatus = 'in_progress'
}) {
  const [engine, setEngine] = useState('livekit'); // 'livekit' | 'webrtc'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.INITIALIZING);
  const [peerPresent, setPeerPresent] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState('Initializing secure clinical media stream...');

  if (engine === 'livekit') {
    return (
      <LiveKitVideoProvider
        appointment={appointment}
        patient={patient}
        doctor={doctor}
        currentUser={currentUser}
        userRole={userRole}
        onEndConsultation={onEndConsultation}
        sessionStatus={sessionStatus}
        onFallbackToWebRTC={() => setEngine('webrtc')}
      />
    );
  }

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const webrtcProviderRef = useRef(null);

  // Timer for active call duration
  useEffect(() => {
    let timer = null;
    if (connectionState === CONNECTION_STATES.CONNECTED) {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionState]);

  // Initialize WebRTC session
  useEffect(() => {
    if (!appointment?.id || !currentUser?.id) return;

    const roomId = appointment.id;
    const userId = currentUser.id;

    const provider = new WebRTCVideoProvider({
      roomId,
      userId,
      userRole,
      onLocalStream: (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        switch (state) {
          case CONNECTION_STATES.WAITING:
            setStatusMessage(
              userRole === 'doctor'
                ? 'Waiting for patient to enter the consultation room...'
                : `Waiting for Dr. ${doctor?.full_name || 'your doctor'} to enter the room...`
            );
            break;
          case CONNECTION_STATES.CONNECTING:
            setStatusMessage('Establishing peer-to-peer encrypted connection...');
            break;
          case CONNECTION_STATES.CONNECTED:
            setStatusMessage('Encrypted Teleconsultation Active');
            setAlertMessage(null);
            break;
          case CONNECTION_STATES.RECONNECTING:
            setStatusMessage('Connection interrupted. Reconnecting to peer...');
            break;
          case CONNECTION_STATES.FAILED:
            setStatusMessage('Connection failed. Please check network.');
            setAlertMessage('Connection to peer interrupted. Click Retry to reconnect.');
            break;
          case CONNECTION_STATES.DISCONNECTED:
            setStatusMessage('Peer temporarily disconnected.');
            break;
          case CONNECTION_STATES.CLOSED:
            setStatusMessage('Consultation encounter concluded.');
            break;
          default:
            break;
        }
      },
      onPeerStateChange: ({ peerPresent: isPresent, peerRole, consultationEnded }) => {
        setPeerPresent(isPresent);
        if (consultationEnded) {
          setStatusMessage('The consultation has been concluded by the attending clinician.');
          onEndConsultation();
        }
      },
      onError: (errMsg) => {
        setAlertMessage(errMsg);
      }
    });

    webrtcProviderRef.current = provider;

    provider.initialize().catch((err) => {
      console.warn('WebRTC initialization notice:', err.message);
    });

    // Cleanup on unmount
    return () => {
      if (webrtcProviderRef.current) {
        webrtcProviderRef.current.close();
        webrtcProviderRef.current = null;
      }
    };
  }, [appointment?.id, currentUser?.id, userRole]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMic = () => {
    if (webrtcProviderRef.current) {
      const isMuted = webrtcProviderRef.current.toggleMicrophone();
      setMicActive(!isMuted);
    }
  };

  const handleToggleCam = () => {
    if (webrtcProviderRef.current) {
      const isMuted = webrtcProviderRef.current.toggleCamera();
      setCamActive(!isMuted);
    }
  };

  const handleToggleScreenShare = async () => {
    if (webrtcProviderRef.current) {
      const sharing = await webrtcProviderRef.current.toggleScreenShare();
      setIsScreenSharing(sharing);
    }
  };

  const handleManualReconnect = () => {
    if (webrtcProviderRef.current) {
      webrtcProviderRef.current.manualReconnect();
    }
  };

  const handleEndCall = () => {
    if (webrtcProviderRef.current) {
      webrtcProviderRef.current.endConsultation();
    }
    onEndConsultation();
  };

  // Peer details to display when waiting
  const peerName = userRole === 'doctor' 
    ? (patient?.full_name || 'Patient') 
    : (doctor?.full_name ? `Dr. ${doctor.full_name}` : 'Attending Doctor');
  const peerInitials = peerName.replace(/^Dr\.\s*/, '').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'MD';

  const isConnected = connectionState === CONNECTION_STATES.CONNECTED;

  return (
    <div style={{
      background: '#0f172a',
      borderRadius: '14px',
      overflow: 'hidden',
      border: '1px solid #1e293b',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.25)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '440px',
      position: 'relative'
    }}>
      {/* Top Session Status Bar */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b',
        zIndex: 10,
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: '#0f766e',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: '700',
            padding: '3px 8px',
            borderRadius: '6px',
            letterSpacing: '0.5px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: isConnected ? '0 0 8px #34d399' : 'none'
            }}></span>
            RAW WEBRTC P2P
          </span>
          <span style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} /> {formatDuration(elapsedSeconds)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            color: isConnected ? '#10b981' : connectionState === CONNECTION_STATES.RECONNECTING ? '#f59e0b' : '#38bdf8',
            background: isConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
            padding: '3px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Radio size={12} /> {connectionState.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#0b1120',
        minHeight: '360px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Remote Video Stream (Full view) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: isConnected ? 'block' : 'none'
          }}
        />

        {/* Remote Placeholder when not streaming */}
        {!isConnected && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            textAlign: 'center',
            color: '#ffffff',
            zIndex: 1
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#0f766e',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '800',
              marginBottom: '16px',
              boxShadow: '0 0 24px rgba(15, 118, 110, 0.4)',
              border: '2px solid #14b8a6'
            }}>
              {peerInitials}
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 6px 0', color: '#f8fafc' }}>
              {peerName}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Encounter: {appointment?.appointment_number || 'APT-LIVE'} • Room ID: {appointment?.id ? appointment.id.slice(0, 8) : 'active'}
            </p>

            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '10px 16px',
              maxWidth: '460px',
              fontSize: '12.5px',
              color: '#cbd5e1'
            }}>
              {statusMessage}
            </div>

            {connectionState === CONNECTION_STATES.FAILED && (
              <button
                onClick={handleManualReconnect}
                style={{
                  marginTop: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} /> Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Floating Picture-in-Picture Local Video Preview */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          width: '130px',
          height: '95px',
          borderRadius: '10px',
          overflow: 'hidden',
          background: '#1e293b',
          border: '2px solid #0f766e',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
          zIndex: 5
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // Mirror local preview
              display: camActive ? 'block' : 'none'
            }}
          />
          {!camActive && (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: '700'
            }}>
              <VideoOff size={18} />
            </div>
          )}
          <span style={{
            position: 'absolute',
            bottom: '4px',
            left: '6px',
            fontSize: '9px',
            fontWeight: '700',
            color: '#ffffff',
            background: 'rgba(0, 0, 0, 0.6)',
            padding: '1px 5px',
            borderRadius: '4px'
          }}>
            You {!micActive && '(Muted)'}
          </span>
        </div>

        {/* Alert Banner */}
        {alertMessage && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(220, 38, 38, 0.9)',
            backdropFilter: 'blur(4px)',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            maxWidth: '90%'
          }}>
            <AlertCircle size={14} /> {alertMessage}
          </div>
        )}
      </div>

      {/* Bottom Control Dock */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.98)',
        borderTop: '1px solid #1e293b',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        zIndex: 10,
        flexWrap: 'wrap'
      }}>
        {/* Mic Toggle */}
        <button
          onClick={handleToggleMic}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: micActive ? '#0f766e' : '#dc2626',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micActive ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={handleToggleCam}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: camActive ? '#0f766e' : '#dc2626',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
          title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {camActive ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        {/* Screen Share (Optional) */}
        <button
          onClick={handleToggleScreenShare}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: isScreenSharing ? '#2563eb' : '#334155',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
          title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <Monitor size={18} />
        </button>

        {/* Conclude Call */}
        <button
          onClick={handleEndCall}
          style={{
            padding: '9px 18px',
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
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.4)'
          }}
        >
          <PhoneOff size={16} /> End Consultation
        </button>
      </div>
    </div>
  );
}
