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
  Sparkles,
  Settings,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

/**
 * LiveKitVideoProvider
 * Ultra-fast, Enterprise-Grade WebRTC SFU Video Conferencing for MediMind AI.
 * Supports multi-party conferencing, adaptive bitrate, screen-sharing,
 * and high-fidelity clinical telehealth calls.
 */
export default function LiveKitVideoProvider({
  appointment,
  patient,
  doctor,
  currentUser,
  userRole = 'doctor',
  onEndConsultation = () => {},
  sessionStatus = 'in_progress',
  onFallbackToWebRTC = () => {}
}) {
  const [room, setRoom] = useState(null);
  const [connectionState, setConnectionState] = useState('initializing'); // 'initializing' | 'connecting' | 'connected' | 'disconnected' | 'needs_config'
  const [micActive, setMicActive] = useState(true);
  const [camActive, setCamActive] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Connecting to LiveKit SFU Cloud...');
  const [errorMessage, setErrorMessage] = useState(null);

  // Setup Modal State (if user hasn't set env keys yet)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [livekitUrl, setLivekitUrl] = useState(
    localStorage.getItem('medimind_livekit_url') || import.meta.env.VITE_LIVEKIT_URL || ''
  );
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('medimind_livekit_key') || import.meta.env.VITE_LIVEKIT_API_KEY || ''
  );
  const [apiSecret, setApiSecret] = useState(
    localStorage.getItem('medimind_livekit_secret') || import.meta.env.VITE_LIVEKIT_API_SECRET || ''
  );

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const roomRef = useRef(null);

  // Call timer
  useEffect(() => {
    let timer = null;
    if (connectionState === 'connected') {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionState]);

  // Connect to LiveKit Room
  useEffect(() => {
    let active = true;

    async function initLiveKit() {
      if (!appointment?.id || !currentUser?.id) return;

      const activeUrl = livekitUrl || import.meta.env.VITE_LIVEKIT_URL;
      const activeKey = apiKey || import.meta.env.VITE_LIVEKIT_API_KEY;

      if (!activeUrl || !activeUrl.startsWith('ws')) {
        setConnectionState('needs_config');
        setShowConfigModal(true);
        setStatusMessage('LiveKit Cloud URL required for SFU conferencing.');
        return;
      }

      setConnectionState('connecting');
      setStatusMessage('Requesting LiveKit Telehealth JWT Token...');

      try {
        // 1. Fetch token from our local Vite token generator or backend endpoint
        const roomId = `appointment-${appointment.id}`;
        const identity = currentUser.id;
        const displayName = currentUser.user_metadata?.full_name || 
                            currentUser.user_metadata?.name || 
                            (userRole === 'doctor' ? `Dr. ${doctor?.full_name || 'Practitioner'}` : (patient?.full_name || 'Patient'));

        let token = '';
        try {
          const res = await fetch(`/api/livekit/token?room=${encodeURIComponent(roomId)}&identity=${encodeURIComponent(identity)}&name=${encodeURIComponent(displayName)}`);
          if (res.ok) {
            const data = await res.json();
            token = data.token;
          }
        } catch (tokenErr) {
          console.warn('[LiveKit] Local token endpoint note:', tokenErr.message);
        }

        // If local endpoint didn't supply token, generate client-side token or use query
        if (!token) {
          // Dynamic client-side token fallback
          token = await generateClientToken({
            apiKey: activeKey || 'devkey',
            apiSecret: apiSecret || 'secret',
            room: roomId,
            identity,
            name: displayName
          });
        }

        // 2. Dynamically import livekit-client
        setStatusMessage('Loading LiveKit Real-Time WebRTC Engine...');
        const { Room, RoomEvent, VideoPresets, Track } = await import('https://esm.sh/livekit-client@2.6.0');

        if (!active) return;

        // 3. Instantiate Room
        const newRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
          videoCaptureDefaults: {
            resolution: VideoPresets.h720.resolution
          }
        });
        roomRef.current = newRoom;
        setRoom(newRoom);

        // 4. Attach Event Listeners
        newRoom.on(RoomEvent.Connected, () => {
          if (!active) return;
          setConnectionState('connected');
          setStatusMessage('LiveKit Encrypted HD Video Conference Active');
          setErrorMessage(null);
        });

        newRoom.on(RoomEvent.Disconnected, () => {
          if (!active) return;
          setConnectionState('disconnected');
          setStatusMessage('LiveKit session ended');
        });

        // Remote Track Subscribed
        newRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (!active) return;
          console.log('[LiveKit] Remote track subscribed:', track.kind, 'from', participant.identity);
          if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
            track.attach(remoteVideoRef.current);
          }
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            document.body.appendChild(el);
          }
          setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
        });

        newRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          track.detach();
          setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
        });

        newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('[LiveKit] Remote participant connected:', participant.identity);
          setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
        });

        newRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log('[LiveKit] Remote participant disconnected:', participant.identity);
          setRemoteParticipants(Array.from(newRoom.remoteParticipants.values()));
        });

        // 5. Connect to Room
        await newRoom.connect(activeUrl, token);

        // 6. Publish local camera and mic
        await newRoom.localParticipant.enableCameraAndMicrophone();

        // Attach local video track
        const videoTrackPublication = Array.from(newRoom.localParticipant.videoTrackPublications.values())[0];
        if (videoTrackPublication && videoTrackPublication.track && localVideoRef.current) {
          videoTrackPublication.track.attach(localVideoRef.current);
        }

      } catch (err) {
        console.error('[LiveKit] Connection error:', err);
        if (!active) return;
        setErrorMessage(err.message || 'Failed to connect to LiveKit server.');
        setConnectionState('needs_config');
      }
    }

    initLiveKit();

    return () => {
      active = false;
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
        } catch {}
        roomRef.current = null;
      }
    };
  }, [livekitUrl, apiKey, apiSecret, appointment?.id, currentUser?.id]);

  // Handle Mute/Unmute Mic
  const toggleMic = async () => {
    if (!room) return;
    try {
      const nextState = !micActive;
      await room.localParticipant.setMicrophoneEnabled(nextState);
      setMicActive(nextState);
    } catch (err) {
      console.warn('Mic toggle notice:', err);
    }
  };

  // Handle Mute/Unmute Camera
  const toggleCam = async () => {
    if (!room) return;
    try {
      const nextState = !camActive;
      await room.localParticipant.setCameraEnabled(nextState);
      setCamActive(nextState);
    } catch (err) {
      console.warn('Camera toggle notice:', err);
    }
  };

  // Handle Screen Share
  const toggleScreenShare = async () => {
    if (!room) return;
    try {
      const nextState = !isScreenSharing;
      await room.localParticipant.setScreenShareEnabled(nextState);
      setIsScreenSharing(nextState);
    } catch (err) {
      console.warn('Screen share notice:', err);
    }
  };

  // Save Config
  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!livekitUrl.trim().startsWith('ws')) {
      alert('Please enter a valid LiveKit WebSocket URL starting with wss:// or ws://');
      return;
    }
    localStorage.setItem('medimind_livekit_url', livekitUrl.trim());
    if (apiKey.trim()) localStorage.setItem('medimind_livekit_key', apiKey.trim());
    if (apiSecret.trim()) localStorage.setItem('medimind_livekit_secret', apiSecret.trim());
    setShowConfigModal(false);
    window.location.reload();
  };

  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const peerName = userRole === 'doctor'
    ? (patient?.full_name || 'Patient')
    : (doctor?.full_name ? `Dr. ${doctor.full_name}` : 'Attending Doctor');

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '620px',
      background: '#090d16',
      borderRadius: '20px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
      border: '1px solid #1e293b',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>

      {/* Top Telehealth Status Header */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 30,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none'
      }}>
        {/* Left Badge: LiveKit Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '8px 16px',
          borderRadius: '9999px',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'auto'
        }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: connectionState === 'connected' ? '#10b981' : '#f59e0b',
            boxShadow: connectionState === 'connected' ? '0 0 10px #10b981' : 'none'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: '800', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={13} color="#38bdf8" /> LiveKit SFU Cloud
            </span>
            <span style={{ color: '#94a3b8', fontSize: '10.5px' }}>
              {statusMessage}
            </span>
          </div>
        </div>

        {/* Right Badges: Duration & Engine Settings */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'auto' }}>
          {connectionState === 'connected' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: '700'
            }}>
              <Clock size={13} color="#10b981" />
              {formatDuration(elapsedSeconds)}
            </div>
          )}

          <button
            onClick={() => setShowConfigModal(true)}
            title="LiveKit Cloud Settings"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#94a3b8',
              borderRadius: '9999px',
              padding: '7px 12px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={13} /> Config
          </button>

          <button
            onClick={onFallbackToWebRTC}
            title="Switch to Built-in WebRTC"
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#38bdf8',
              borderRadius: '9999px',
              padding: '7px 12px',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Built-in WebRTC
          </button>
        </div>
      </div>

      {/* Main Video Viewport (Remote Peer) */}
      <div style={{
        flex: 1,
        position: 'relative',
        background: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Remote Video Element */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: remoteParticipants.length > 0 ? 'block' : 'none'
          }}
        />

        {/* Placeholder when peer has not yet connected */}
        {remoteParticipants.length === 0 && connectionState !== 'needs_config' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(30, 41, 59, 0.6)',
              border: '2px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: '#38bdf8'
            }}>
              <User size={40} />
            </div>
            <h4 style={{ color: '#ffffff', fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0' }}>
              Waiting for {peerName}
            </h4>
            <p style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '360px', margin: 0, lineHeight: '1.5' }}>
              Your LiveKit video conference room is ready. When {peerName} joins, their encrypted HD stream will automatically render here.
            </p>
          </div>
        )}

        {/* Self View (Picture-in-Picture) */}
        <div style={{
          position: 'absolute',
          bottom: '84px',
          right: '20px',
          width: '180px',
          height: '115px',
          borderRadius: '14px',
          overflow: 'hidden',
          background: '#1e293b',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          zIndex: 25
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
              transform: 'scaleX(-1)' // Mirror local view
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '6px',
            left: '8px',
            background: 'rgba(0,0,0,0.7)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '700',
            color: '#ffffff'
          }}>
            You ({userRole.toUpperCase()})
          </div>
        </div>
      </div>

      {/* Bottom Floating Control Bar */}
      <div style={{
        padding: '16px 24px',
        background: 'rgba(15, 23, 42, 0.95)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        zIndex: 30
      }}>
        {/* Toggle Mic */}
        <button
          onClick={toggleMic}
          title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: 'none',
            background: micActive ? '#334155' : '#dc2626',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {micActive ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Toggle Camera */}
        <button
          onClick={toggleCam}
          title={camActive ? 'Turn Off Camera' : 'Turn On Camera'}
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: 'none',
            background: camActive ? '#334155' : '#dc2626',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {camActive ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={toggleScreenShare}
          title="Share Screen"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            border: 'none',
            background: isScreenSharing ? '#0284c7' : '#334155',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Monitor size={20} />
        </button>

        {/* End Consultation */}
        <button
          onClick={onEndConsultation}
          title="End Teleconsultation Encounter"
          style={{
            padding: '0 24px',
            height: '46px',
            borderRadius: '9999px',
            border: 'none',
            background: '#dc2626',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontWeight: '800',
            fontSize: '13.5px',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
          }}
        >
          <PhoneOff size={18} /> End Call
        </button>
      </div>

      {/* Config Setup Modal (If keys not provided) */}
      {(showConfigModal || connectionState === 'needs_config') && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(9, 13, 22, 0.96)',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '520px',
            width: '100%',
            color: '#ffffff',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={22} color="#ffffff" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>LiveKit Cloud SFU Setup</h3>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>High-Speed Telehealth Video Conferencing</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', marginBottom: '20px' }}>
              Get your free LiveKit Cloud keys at <a href="https://cloud.livekit.io" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontWeight: '700' }}>cloud.livekit.io</a> (Free 50GB monthly bandwidth) or enter your local LiveKit server:
            </p>

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                  LiveKit WebSocket URL:
                </label>
                <input
                  type="text"
                  placeholder="wss://your-project.livekit.cloud"
                  value={livekitUrl}
                  onChange={(e) => setLivekitUrl(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                  LiveKit API Key:
                </label>
                <input
                  type="text"
                  placeholder="APIxxxxxxxxxxxx"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                  LiveKit API Secret:
                </label>
                <input
                  type="password"
                  placeholder="Secret key"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #334155',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#0284c7',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Save & Connect LiveKit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowConfigModal(false);
                    onFallbackToWebRTC();
                  }}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '10px',
                    background: '#334155',
                    color: '#ffffff',
                    fontWeight: '700',
                    fontSize: '13px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Use Built-in WebRTC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * Generates an HMAC-SHA256 signed LiveKit token in browser without npm packages
 */
async function generateClientToken({ apiKey, apiSecret, room, identity, name }) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: identity,
    iss: apiKey,
    nbf: now - 5,
    exp: now + (24 * 60 * 60),
    name: name || identity,
    video: {
      room: room || 'teleconsultation',
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true
    }
  };

  const base64Url = (obj) => {
    return btoa(JSON.stringify(obj))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const encodedHeader = base64Url(header);
  const encodedPayload = base64Url(payload);
  const data = `${encodedHeader}.${encodedPayload}`;

  // Sign with subtle crypto
  const enc = new TextEncoder();
  const key = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign('HMAC', key, enc.encode(data));
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}
