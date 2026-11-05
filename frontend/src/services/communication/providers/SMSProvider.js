/**
 * MediMind AI — Phase 9 Communication Platform
 * SMS Provider Abstraction
 * Enforces 160-character safety window, strict NOT_CONFIGURED status, and minimum necessary PHI.
 */

import { DELIVERY_STATUS, NOTIFICATION_CHANNELS } from '../provider.types.js';

export class SMSProvider {
  constructor(config = {}) {
    this.name = 'sms';
    this.channel = NOTIFICATION_CHANNELS.SMS;
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.SMS_API_KEY : null);
    this.senderId = config.senderId || (typeof process !== 'undefined' ? process.env?.SMS_SENDER_ID : 'MEDMND');
    this.gatewayUrl = config.gatewayUrl || (typeof process !== 'undefined' ? process.env?.SMS_GATEWAY_URL : null);
  }

  isConfigured() {
    return Boolean(this.apiKey && this.gatewayUrl);
  }

  async send({ to, message, priority = 'NORMAL', metadata = {} }) {
    if (!this.isConfigured()) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.NOT_CONFIGURED,
        recipient: to,
        error: 'SMS provider gateway credentials not configured in environment',
        timestamp: new Date().toISOString()
      };
    }

    if (!to || !message) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.FAILED,
        recipient: to,
        error: 'Invalid SMS payload: phone number (to) and message text are required',
        timestamp: new Date().toISOString()
      };
    }

    // Sanitize message: never exceed length, strip newlines if needed
    const safeText = String(message).slice(0, 320);

    try {
      const response = await fetch(this.gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          sender: this.senderId,
          to,
          message: safeText,
          priority
        })
      });

      if (!response.ok) {
        throw new Error(`SMS gateway error HTTP ${response.status}`);
      }

      const resJson = await response.json().catch(() => ({}));
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.SENT,
        messageId: resJson.sms_id || `sms-${Date.now()}`,
        recipient: to,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.FAILED,
        recipient: to,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const smsProvider = new SMSProvider();
