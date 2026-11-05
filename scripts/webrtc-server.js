/**
 * MediMind AI — Standalone WebRTC WebSocket Signaling Server
 * 
 * Run locally or on your VPS for unlimited, ultra-fast peer-to-peer video conference signaling:
 * Usage:
 *   node scripts/webrtc-server.js
 * 
 * Default Port: 8080 (or set PORT=8080)
 * WebSocket URL: ws://localhost:8080 (or wss://your-domain.com:8080)
 */

import http from 'http';
import { createServer } from 'http';

const PORT = process.env.PORT || 8080;

// Track active rooms and connected peers
// Structure: Map<roomId, Set<WebSocket>>
const rooms = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({
    service: 'MediMind WebRTC Signaling Server',
    status: 'ONLINE',
    activeRooms: rooms.size,
    timestamp: new Date().toISOString()
  }));
});

// Minimalist RFC 6455 WebSocket Handshake implementation (zero external npm dependencies required)
import crypto from 'crypto';

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room') || 'default-room';
  const userId = url.searchParams.get('user') || `user-${Date.now()}`;

  const key = req.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`
  ];

  socket.write(headers.join('\r\n') + '\r\n\r\n');

  // Register peer in room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  const roomPeers = rooms.get(roomId);
  roomPeers.add(socket);

  socket.roomId = roomId;
  socket.userId = userId;

  console.log(`[WebRTC Server] Peer connected: ${userId} in Room: ${roomId} (Total in room: ${roomPeers.size})`);

  socket.on('data', (buffer) => {
    try {
      // Decode WebSocket frame
      const firstByte = buffer[0];
      const opCode = firstByte & 0x0f;

      // Opcode 8: Connection Close
      if (opCode === 8) {
        socket.destroy();
        return;
      }

      // Opcode 1: Text Frame
      if (opCode === 1) {
        const secondByte = buffer[1];
        const isMasked = (secondByte & 0x80) === 0x80;
        let payloadLength = secondByte & 0x7f;
        let offset = 2;

        if (payloadLength === 126) {
          payloadLength = buffer.readUInt16BE(offset);
          offset += 2;
        } else if (payloadLength === 127) {
          payloadLength = Number(buffer.readBigUInt64BE(offset));
          offset += 8;
        }

        let maskingKey = null;
        if (isMasked) {
          maskingKey = buffer.slice(offset, offset + 4);
          offset += 4;
        }

        const payloadData = buffer.slice(offset, offset + payloadLength);
        if (isMasked && maskingKey) {
          for (let i = 0; i < payloadData.length; i++) {
            payloadData[i] ^= maskingKey[i % 4];
          }
        }

        const rawMessage = payloadData.toString('utf8');

        // Broadcast to other peers in the same room
        const peers = rooms.get(roomId);
        if (peers) {
          for (const peer of peers) {
            if (peer !== socket && !peer.destroyed) {
              sendWsText(peer, rawMessage);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[WebRTC Server] Frame processing error:', err.message);
    }
  });

  socket.on('close', () => {
    if (rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.delete(socket);
      if (room.size === 0) {
        rooms.delete(roomId);
      }
    }
    console.log(`[WebRTC Server] Peer disconnected: ${userId} from Room: ${roomId}`);
  });

  socket.on('error', () => {
    socket.destroy();
  });
});

function sendWsText(socket, text) {
  try {
    const payload = Buffer.from(text, 'utf8');
    const length = payload.length;

    let header;
    if (length < 126) {
      header = Buffer.from([0x81, length]);
    } else if (length <= 65535) {
      header = Buffer.alloc(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(length, 2);
    } else {
      header = Buffer.alloc(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(length), 2);
    }

    socket.write(Buffer.concat([header, payload]));
  } catch (err) {
    console.warn('[WebRTC Server] Send frame error:', err.message);
  }
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` MediMind AI — WebRTC Live Video Signaling Server`);
  console.log(` Status: RUNNING on http://localhost:${PORT}`);
  console.log(` WebSocket URL: ws://localhost:${PORT}`);
  console.log(` Zero dependencies required — Pure Node.js WebRTC Relay`);
  console.log(`=======================================================`);
});
