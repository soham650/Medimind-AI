# MEDIMIND AI — WEBRTC LIVE VIDEO CONSULTATION ARCHITECTURE

> **Production Declaration:**  
> "WebRTC video consultation uses browser-native WebRTC. No paid video provider is required."  
> Production-grade TURN infrastructure may incur external hosting/bandwidth costs if required for symmetrical NAT traversal.

---

## 1. Architectural Overview

MediMind AI implements a pure, browser-native WebRTC teleconsultation gateway connecting authenticated patients with verified medical practitioners.

```
+-----------------------------------------------------------------------------------+
|                            PATIENT BROWSER CLIENT                                 |
|                                                                                   |
|  +--------------------+   getUserMedia()    +----------------------------------+  |
|  | ConsultationRoom   | ------------------> | Camera & Mic Tracks (MediaStream)|  |
|  | (Patient View)     |                     +----------------------------------+  |
|  +--------------------+                                       |                   |
|            |                                                  v                   |
|            | validateConsultationAccess()       +-------------------------------+ |
|            v                                    |   RTCPeerConnection (Local)   | |
|  +--------------------+                         +-------------------------------+ |
|  | Supabase Auth / RLS|                                       |                   |
+---------------------------------------------------------------|-------------------+
             |                                                  |
             | Authenticated Session                            | P2P Encrypted
             v                                                  | SRTP/DTLS Media
+-------------------------+                                     |
| Supabase Realtime Stream| <--- Signaling Broadcast Channel --+
| (consultation-{room_id})|      (Zero PHI: Offer/Answer/ICE)   |
+-------------------------+                                     |
             ^                                                  |
             | Authenticated Session                            |
+---------------------------------------------------------------|-------------------+
|            |                                                  v                   |
|  +--------------------+                         +-------------------------------+ |
|  | Supabase Auth / RLS|                         |   RTCPeerConnection (Remote)  | |
|  +--------------------+                         +-------------------------------+ |
|            ^                                                  |                   |
|            | validateConsultationAccess()                     v                   |
|  +--------------------+   getUserMedia()    +----------------------------------+  |
|  | ConsultationRoom   | ------------------> | Camera & Mic Tracks (MediaStream)|  |
|  | (Doctor View)      |                     +----------------------------------+  |
|  +--------------------+                                                           |
|                            VERIFIED DOCTOR BROWSER                                |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Abstraction Layer

The system adheres strictly to the provider design pattern:

```
VideoConsultationProvider.jsx (UI Presentation Component)
           └── WebRTCVideoProvider.js (Underlying Real-Time WebRTC Service)
```

### Key Provider Capabilities:
* **Zero Third-Party Vendor Locks:** No Twilio, Agora, Daily, Zoom, or Google Meet SDKs.
* **Audio/Video Media Streams:** Standard `navigator.mediaDevices.getUserMedia()`.
* **Graceful Media Fallback:** If camera access is denied or hardware is unavailable, automatically falls back to audio-only consultation without crashing.
* **Microphone Mute/Unmute:** Toggles audio track `enabled` state dynamically without connection re-negotiation.
* **Camera Privacy Toggle:** Toggles video track `enabled` state with instant visual UI feedback.
* **Optional Screen Share:** Integrates `navigator.mediaDevices.getDisplayMedia()`, swapping the video track sender atomically and automatically restoring the camera track on conclusion.
* **Complete Teardown:** Releases all local media tracks, closes `RTCPeerConnection`, and unsubscribes from the realtime signaling channel to guarantee zero memory leaks.

---

## 3. Signaling Architecture

WebRTC requires an out-of-band signaling mechanism to exchange session descriptions (SDP) and ICE network candidates. MediMind AI uses **Supabase Realtime Broadcast Channels**.

* **Channel Identifier:** `consultation-${appointment_id}`
* **Signaling Events:**
  1. `peer-ready`: Informs peer that client has initialized local media and is ready to establish connection.
  2. `peer-ready-ack`: Acknowledges peer presence.
  3. `offer`: Initiator (attending doctor) creates and sends `RTCSessionDescription` offer.
  4. `answer`: Recipient (patient) sets remote description and responds with `RTCSessionDescription` answer.
  5. `ice-candidate`: Exchanging `RTCIceCandidate` network routing addresses.
  6. `peer-leave`: Signals departure from the consultation room.
  7. `consultation-ended`: Concludes encounter.
  8. `reconnect-request`: Requests ICE renegotiation during transient network drops.

### Candidate Buffering (Queueing)
To resolve WebRTC race conditions where ICE candidates arrive prior to `setRemoteDescription`, incoming candidates are buffered in `candidateQueue` and flushed automatically once remote descriptions are established.

---

## 4. Secure Room Authorization Model

Access to a consultation room is strictly locked behind a multi-tier security gate:

| Evaluation Step | Rule | Failure Action |
| :--- | :--- | :--- |
| **1. Authentication** | Active Supabase Auth session required | Rejection (`UNAUTHENTICATED`) |
| **2. Appointment Existence** | Valid row in `public.appointments` | Rejection (`APPOINTMENT_NOT_FOUND`) |
| **3. Appointment Status** | Must be in `['requested', 'scheduled', 'confirmed', 'in_progress']` | Rejection (`APPOINTMENT_CANCELLED` or `APPOINTMENT_COMPLETED`) |
| **4. Participant Matching** | User ID must match `appointment.patient_id` OR `appointment.doctor_id` | Rejection (`UNAUTHORIZED_PARTICIPANT`) |
| **5. Doctor Verification** | If doctor, `verification_status` must equal `'approved'` in `public.doctors` | Rejection (`DOCTOR_NOT_VERIFIED`) |
| **6. Admin Boundary** | Platform administrators cannot enter live teleconsultation without patient consent | Rejection (`UNAUTHORIZED_PARTICIPANT`) |

---

## 5. Privacy & Zero-PHI Invariant

The WebRTC signaling channel and logs strictly enforce **Minimum Necessary Information**:

* **Room Identifiers:** Based purely on cryptographically random UUIDs (`appointment_id`). Room URLs never contain patient names, doctor names, diagnoses, or symptoms.
* **Signaling Payloads:** Strictly restricted to technical WebRTC negotiation parameters:
  ```json
  {
    "type": "offer",
    "senderId": "uuid-here",
    "senderRole": "doctor",
    "timestamp": 1790528000000,
    "sdp": { "type": "offer", "sdp": "v=0..." }
  }
  ```
* **Forbidden Fields:** Zero diagnosis, zero symptoms, zero lab values, zero medical reports, and zero patient history in signaling payloads or browser console logs.
* **Consultation Recording:** **RECORDING = DISABLED**. No audio/video data is recorded or persisted.

---

## 6. Connection States & Bounded Reconnection Engine

The interface implements reactive state handling across all 9 connection lifecycle states:

```
[IDLE] ──> [INITIALIZING] ──> [WAITING] ──> [CONNECTING] ──> [CONNECTED]
                                                  │               │
                                           (Network Drop)   (Encounter End)
                                                  │               │
                                                  v               v
                                            [RECONNECTING]     [CLOSED]
                                                  │
                                            (Max 3 Retries)
                                                  │
                                                  v
                                               [FAILED] (Manual Retry)
```

1. **Transient Disconnect Detection:** Monitored via `connectionState` and `iceConnectionState`.
2. **Exponential Bounded Backoff:** Max 3 automatic reconnection attempts using `createOffer({ iceRestart: true })`.
3. **No Infinite Loops:** If 3 attempts fail, transitions to `FAILED` and presents user with a "Retry Connection" button.

---

## 7. Post-Consultation Workflow: Clinical Notes & Prescriptions

When a consultation concludes:
1. **Attending Doctor:**
   * Completes Clinical Observations (Objective) and Confirmed Diagnosis (Mandatory).
   * Clicks **"Conclude & Sign Encounter"** to save to the patient's EHR vault.
   * Can open **"Open Digital Rx Pad"** to author itemized prescriptions via the existing atomic `create_prescription_tx` RPC.
   * Automated Phase 9 notification (`CONSULTATION_CONCLUDED`) is dispatched to the patient.
2. **Patient:**
   * Receives consultation conclusion status banner.
   * Given immediate quick-link to **View Digital Prescriptions** (`/prescriptions`) to view medications or order from the pharmacy network.

---

## 8. Environment Variables

Client-safe configuration (`frontend/.env`):
```env
# Public STUN Server
VITE_WEBRTC_STUN_URL=stun:stun.l.google.com:19302
```

> **Security Rule:** Never place TURN secret keys, passwords, or service-role keys in frontend `.env`. If dynamic TURN credentials are required in future enterprise environments, they must be fetched via an authenticated server-side RPC.

---

## 9. Verification & Automated Testing

Verification suite located at `scripts/verify_webrtc_consultation.js`:

```powershell
# Run the 25-point automated verification suite
node scripts/verify_webrtc_consultation.js
```

### Suite Results:
* **25 / 25 PASS (100%)**
* Group 1: Room Authorization & Access Control (Tests 01–08): **PASS**
* Group 2: WebRTC Abstraction & Signaling Protocol (Tests 09–21): **PASS**
* Group 3: Privacy, PHI Scrubbing & Integration Safety (Tests 22–25): **PASS**
* Database Schema: **0001–0009 FROZEN (Zero migrations created)**
