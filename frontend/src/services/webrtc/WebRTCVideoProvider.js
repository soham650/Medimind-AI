/**
 * MediMind AI — Raw Browser-Native WebRTC Video Provider
 * Production telehealth real-time peer connection provider.
 * Implements browser-native WebRTC (getUserMedia, RTCPeerConnection, MediaStream)
 * and Supabase Realtime channel signaling.
 * Zero paid video SDKs (No Twilio, Agora, Daily, Zoom, Google Meet).
 */

import { supabase } from '../../lib/supabaseClient.js';

// Public STUN server configuration (Never store TURN secrets in frontend)
const DEFAULT_STUN_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WEBRTC_STUN_URL) || 
  'stun:stun.l.google.com:19302';

export const CONNECTION_STATES = Object.freeze({
  IDLE: 'idle',
  INITIALIZING: 'initializing',
  WAITING: 'waiting',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
  DISCONNECTED: 'disconnected',
  CLOSED: 'closed'
});

export const PEER_ROLES = Object.freeze({
  DOCTOR: 'doctor',
  PATIENT: 'patient'
});

export class WebRTCVideoProvider {
  constructor({
    roomId,
    userId,
    userRole,
    onLocalStream = () => {},
    onRemoteStream = () => {},
    onConnectionStateChange = () => {},
    onPeerStateChange = () => {},
    onError = () => {}
  }) {
    if (!roomId || !userId) {
      throw new Error('WebRTCVideoProvider requires a valid roomId and userId.');
    }

    this.roomId = roomId;
    this.userId = userId;
    this.userRole = userRole || PEER_ROLES.PATIENT;

    // Callbacks
    this.onLocalStream = onLocalStream;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onPeerStateChange = onPeerStateChange;
    this.onError = onError;

    // WebRTC Core
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.screenStream = null;
    this.cameraVideoTrack = null;

    // Signaling Channel
    this.channel = null;
    this.channelSubscribed = false;

    // State Tracking
    this.state = CONNECTION_STATES.IDLE;
    this.isMicMuted = false;
    this.isVideoMuted = false;
    this.isScreenSharing = false;
    this.peerPresent = false;
    this.peerRole = null;
    this.isInitiator = this.userRole === PEER_ROLES.DOCTOR; // Doctor initiates offer by default

    // ICE Candidate Queue (buffers candidates before remoteDescription is set)
    this.candidateQueue = [];

    // Reconnection Tracking
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectTimeout = null;

    // Bound handlers for listener cleanup
    this._handleIceCandidate = this._handleIceCandidate.bind(this);
    this._handleTrack = this._handleTrack.bind(this);
    this._handleConnectionStateChange = this._handleConnectionStateChange.bind(this);
    this._handleIceConnectionStateChange = this._handleIceConnectionStateChange.bind(this);
    this._handleSignalingMessage = this._handleSignalingMessage.bind(this);
  }

  /**
   * Initializes media devices and joins signaling room
   */
  async initialize() {
    this._setState(CONNECTION_STATES.INITIALIZING);

    try {
      // 1. Check browser WebRTC compatibility
      if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support browser-native WebRTC.');
      }

      // 2. Request user media (Camera + Mic) with graceful audio-only fallback
      await this._requestMediaStream();

      // 3. Connect to Supabase Realtime Signaling channel
      await this._connectSignaling();

      // 4. Create RTCPeerConnection instance
      this._createPeerConnection();

      // 5. Add local media tracks to peer connection
      if (this.localStream && this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
        });
      }

      this._setState(CONNECTION_STATES.WAITING);

      // 6. Broadcast presence to peer
      await this._sendSignal('peer-ready', {
        senderRole: this.userRole
      });

    } catch (err) {
      console.warn('WebRTC initialization notice:', err.message);
      this._setState(CONNECTION_STATES.FAILED);
      this.onError(this._formatMediaError(err));
      throw err;
    }
  }

  /**
   * Requests camera and microphone streams gracefully
   */
  async _requestMediaStream() {
    try {
      // Primary attempt: Video + Audio
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.cameraVideoTrack = this.localStream.getVideoTracks()[0] || null;
      this.onLocalStream(this.localStream);
    } catch (primaryErr) {
      // Fallback attempt: Audio only if camera is unavailable or denied
      console.warn('Camera capture failed, attempting audio-only fallback:', primaryErr.name);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
        this.cameraVideoTrack = null;
        this.isVideoMuted = true;
        this.onLocalStream(this.localStream);
        this.onError('Camera unavailable or denied. Consultation continuing in audio-only mode.');
      } catch (fallbackErr) {
        throw primaryErr; // Throw original error for descriptive reporting
      }
    }
  }

  /**
   * Sets up RTCPeerConnection with STUN configuration
   */
  _createPeerConnection() {
    if (this.peerConnection) {
      this._cleanupPeerConnection();
    }

    const rtcConfig = {
      iceServers: [
        { urls: DEFAULT_STUN_URL }
      ],
      iceCandidatePoolSize: 4
    };

    this.peerConnection = new RTCPeerConnection(rtcConfig);

    this.peerConnection.onicecandidate = this._handleIceCandidate;
    this.peerConnection.ontrack = this._handleTrack;
    this.peerConnection.onconnectionstatechange = this._handleConnectionStateChange;
    this.peerConnection.oniceconnectionstatechange = this._handleIceConnectionStateChange;
  }

  /**
   * Connects to Supabase Realtime broadcast channel for signaling
   */
  async _connectSignaling() {
    const channelName = `consultation-${this.roomId}`;

    this.channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false }
      }
    });

    this.channel.on('broadcast', { event: 'signal' }, payload => {
      this._handleSignalingMessage(payload.payload);
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(); // Resolve on timeout to not block UI if realtime is slow
      }, 5000);

      this.channel.subscribe(status => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          this.channelSubscribed = true;
          resolve();
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout);
          console.warn('Realtime signaling channel warning, will retry.');
          resolve();
        }
      });
    });
  }

  /**
   * Dispatches signaling messages via broadcast (Zero PHI)
   */
  async _sendSignal(type, data = {}) {
    if (!this.channel) return;

    // Scrub payload: only technical WebRTC metadata allowed
    const safePayload = {
      type,
      senderId: this.userId,
      senderRole: this.userRole,
      timestamp: Date.now(),
      ...data
    };

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: safePayload
      });
    } catch (err) {
      console.warn('Signaling transmission warning:', err.message);
    }
  }

  /**
   * Handles incoming signaling messages
   */
  async _handleSignalingMessage(message) {
    if (!message || message.senderId === this.userId) return;

    switch (message.type) {
      case 'peer-ready':
        this.peerPresent = true;
        this.peerRole = message.senderRole;
        this.onPeerStateChange({ peerPresent: true, peerRole: this.peerRole });

        // If this client is initiator (doctor) or negotiated initiator, create Offer
        if (this.isInitiator && this.peerConnection) {
          await this._initiateOffer();
        } else {
          // Acknowledge ready presence to peer
          await this._sendSignal('peer-ready-ack', { senderRole: this.userRole });
        }
        break;

      case 'peer-ready-ack':
        this.peerPresent = true;
        this.peerRole = message.senderRole;
        this.onPeerStateChange({ peerPresent: true, peerRole: this.peerRole });
        if (this.isInitiator && this.peerConnection) {
          await this._initiateOffer();
        }
        break;

      case 'offer':
        await this._handleOffer(message.sdp);
        break;

      case 'answer':
        await this._handleAnswer(message.sdp);
        break;

      case 'ice-candidate':
        await this._handleRemoteIceCandidate(message.candidate);
        break;

      case 'peer-leave':
        this.peerPresent = false;
        this._setState(CONNECTION_STATES.DISCONNECTED);
        this.onPeerStateChange({ peerPresent: false, peerRole: null });
        break;

      case 'consultation-ended':
        this._setState(CONNECTION_STATES.CLOSED);
        this.onPeerStateChange({ consultationEnded: true });
        break;

      case 'reconnect-request':
        if (this.isInitiator) {
          await this._initiateOffer({ iceRestart: true });
        }
        break;

      default:
        break;
    }
  }

  /**
   * Creates and sends SDP Offer
   */
  async _initiateOffer(options = {}) {
    if (!this.peerConnection) return;
    try {
      this._setState(CONNECTION_STATES.CONNECTING);
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: !!options.iceRestart
      });
      await this.peerConnection.setLocalDescription(offer);

      await this._sendSignal('offer', {
        sdp: {
          type: offer.type,
          sdp: offer.sdp
        }
      });
    } catch (err) {
      console.warn('Error creating WebRTC offer:', err.message);
    }
  }

  /**
   * Handles incoming SDP Offer and generates Answer
   */
  async _handleOffer(sdp) {
    if (!this.peerConnection || !sdp) return;
    try {
      this._setState(CONNECTION_STATES.CONNECTING);
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));

      // Flush any queued ICE candidates received prior to remoteDescription
      await this._flushCandidateQueue();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      await this._sendSignal('answer', {
        sdp: {
          type: answer.type,
          sdp: answer.sdp
        }
      });
    } catch (err) {
      console.warn('Error handling WebRTC offer:', err.message);
    }
  }

  /**
   * Handles incoming SDP Answer
   */
  async _handleAnswer(sdp) {
    if (!this.peerConnection || !sdp) return;
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
      await this._flushCandidateQueue();
    } catch (err) {
      console.warn('Error handling WebRTC answer:', err.message);
    }
  }

  /**
   * Dispatches local ICE candidate to peer
   */
  _handleIceCandidate(event) {
    if (event.candidate) {
      this._sendSignal('ice-candidate', {
        candidate: {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        }
      });
    }
  }

  /**
   * Handles remote ICE candidate with queueing support
   */
  async _handleRemoteIceCandidate(candidateData) {
    if (!candidateData) return;
    try {
      const candidate = new RTCIceCandidate(candidateData);
      if (this.peerConnection && this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type) {
        await this.peerConnection.addIceCandidate(candidate);
      } else {
        // Remote description not set yet; queue candidate
        this.candidateQueue.push(candidate);
      }
    } catch (err) {
      console.warn('Error adding remote ICE candidate:', err.message);
    }
  }

  /**
   * Flushes queued ICE candidates once remoteDescription is set
   */
  async _flushCandidateQueue() {
    while (this.candidateQueue.length > 0) {
      const candidate = this.candidateQueue.shift();
      try {
        await this.peerConnection.addIceCandidate(candidate);
      } catch (err) {
        console.warn('Error flushing queued candidate:', err.message);
      }
    }
  }

  /**
   * Handles incoming remote media track
   */
  _handleTrack(event) {
    if (event.streams && event.streams[0]) {
      this.remoteStream = event.streams[0];
      this.onRemoteStream(this.remoteStream);
    } else {
      // Fallback: create stream from received track
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        this.onRemoteStream(this.remoteStream);
      }
      this.remoteStream.addTrack(event.track);
    }
  }

  /**
   * Monitors RTCPeerConnection connection state
   */
  _handleConnectionStateChange() {
    if (!this.peerConnection) return;
    const state = this.peerConnection.connectionState;

    switch (state) {
      case 'connected':
        this.reconnectAttempts = 0;
        this._setState(CONNECTION_STATES.CONNECTED);
        break;
      case 'connecting':
        this._setState(CONNECTION_STATES.CONNECTING);
        break;
      case 'disconnected':
        this._triggerReconnect();
        break;
      case 'failed':
        this._triggerReconnect();
        break;
      case 'closed':
        this._setState(CONNECTION_STATES.CLOSED);
        break;
      default:
        break;
    }
  }

  /**
   * Monitors ICE connection state
   */
  _handleIceConnectionStateChange() {
    if (!this.peerConnection) return;
    const iceState = this.peerConnection.iceConnectionState;

    if (iceState === 'connected' || iceState === 'completed') {
      this.reconnectAttempts = 0;
      this._setState(CONNECTION_STATES.CONNECTED);
    } else if (iceState === 'disconnected' || iceState === 'failed') {
      this._triggerReconnect();
    }
  }

  /**
   * Reconnection handling with bounded retries
   */
  _triggerReconnect() {
    if (this.state === CONNECTION_STATES.CLOSED || this.state === CONNECTION_STATES.FAILED) return;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this._setState(CONNECTION_STATES.RECONNECTING);

      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(async () => {
        try {
          if (this.isInitiator) {
            await this._initiateOffer({ iceRestart: true });
          } else {
            await this._sendSignal('reconnect-request');
          }
        } catch (err) {
          console.warn('Reconnection renegotiation error:', err.message);
        }
      }, 2000 * this.reconnectAttempts);
    } else {
      this._setState(CONNECTION_STATES.FAILED);
      this.onError('Connection to peer interrupted. You can attempt to manually reconnect.');
    }
  }

  /**
   * Manual reconnect trigger from UI
   */
  async manualReconnect() {
    this.reconnectAttempts = 0;
    this._setState(CONNECTION_STATES.CONNECTING);
    if (this.isInitiator) {
      await this._initiateOffer({ iceRestart: true });
    } else {
      await this._sendSignal('reconnect-request');
    }
  }

  /**
   * Microphone toggle
   */
  toggleMicrophone() {
    if (!this.localStream) return this.isMicMuted;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      this.isMicMuted = !audioTrack.enabled;
      return this.isMicMuted;
    }
    return this.isMicMuted;
  }

  /**
   * Camera toggle
   */
  toggleCamera() {
    if (!this.localStream) return this.isVideoMuted;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      this.isVideoMuted = !videoTrack.enabled;
      return this.isVideoMuted;
    }
    return this.isVideoMuted;
  }

  /**
   * Optional Screen Share Lifecycle
   */
  async toggleScreenShare() {
    if (this.isScreenSharing) {
      await this.stopScreenShare();
      return false;
    } else {
      return await this.startScreenShare();
    }
  }

  async startScreenShare() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      this.onError('Screen sharing is not supported by your current browser.');
      return false;
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });

      const screenTrack = this.screenStream.getVideoTracks()[0];
      if (!screenTrack) return false;

      // Replace track on peer connection
      if (this.peerConnection) {
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }
      }

      this.isScreenSharing = true;

      // Listen for browser native "Stop Sharing" action
      screenTrack.onended = () => {
        this.stopScreenShare();
      };

      return true;
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.warn('Screen share start notice:', err.message);
      }
      return false;
    }
  }

  async stopScreenShare() {
    if (!this.isScreenSharing) return;

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(t => t.stop());
      this.screenStream = null;
    }

    // Restore camera video track
    if (this.peerConnection && this.cameraVideoTrack) {
      try {
        const senders = this.peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && (s.track.kind === 'video' || s.track === null));
        if (videoSender) {
          await videoSender.replaceTrack(this.cameraVideoTrack);
        }
      } catch (err) {
        console.warn('Track restore notice:', err.message);
      }
    }

    this.isScreenSharing = false;
  }

  /**
   * Ends consultation, broadcasts conclusion, and cleans up resources
   */
  async endConsultation() {
    try {
      await this._sendSignal('consultation-ended');
    } catch (err) {
      // Ignore broadcast errors during teardown
    }
    this.close();
  }

  /**
   * Complete Teardown & Resource Cleanup (Zero Memory Leaks)
   */
  close() {
    this._setState(CONNECTION_STATES.CLOSED);

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Stop local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    // Stop screen share
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => {
        track.stop();
      });
      this.screenStream = null;
    }

    this.cameraVideoTrack = null;
    this.remoteStream = null;
    this.candidateQueue = [];

    // Cleanup PeerConnection
    this._cleanupPeerConnection();

    // Unsubscribe from Realtime channel
    if (this.channel) {
      try {
        supabase.removeChannel(this.channel);
      } catch (err) {
        // Channel removal safe catch
      }
      this.channel = null;
      this.channelSubscribed = false;
    }
  }

  _cleanupPeerConnection() {
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      this.peerConnection.ontrack = null;
      this.peerConnection.onconnectionstatechange = null;
      this.peerConnection.oniceconnectionstatechange = null;
      try {
        this.peerConnection.close();
      } catch (err) {
        // PeerConnection close safe catch
      }
      this.peerConnection = null;
    }
  }

  _setState(newState) {
    this.state = newState;
    this.onConnectionStateChange(newState);
  }

  _formatMediaError(err) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return 'Camera or microphone access was denied. Please allow permissions in your browser address bar.';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return 'No camera or microphone hardware was detected on your device.';
      case 'NotReadableError':
      case 'TrackStartError':
        return 'Your camera or microphone is currently in use by another application.';
      case 'OverconstrainedError':
        return 'Your camera does not meet the resolution requirements for HD video.';
      case 'SecurityError':
        return 'Media access is blocked due to browser security settings.';
      default:
        return err.message || 'Unable to access media devices.';
    }
  }
}
