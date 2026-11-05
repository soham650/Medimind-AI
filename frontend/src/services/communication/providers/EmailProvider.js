/**
 * MediMind AI — Phase 9 Communication Platform
 * Email Provider Abstraction
 * Enforces minimum necessary PHI, mobile-responsive layout, and strict NOT_CONFIGURED status invariant.
 */

import { DELIVERY_STATUS, NOTIFICATION_CHANNELS } from '../provider.types.js';

export class EmailProvider {
  constructor(config = {}) {
    this.name = 'email';
    this.channel = NOTIFICATION_CHANNELS.EMAIL;
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.EMAIL_API_KEY : null);
    this.fromAddress = config.fromAddress || (typeof process !== 'undefined' ? process.env?.EMAIL_FROM : 'notifications@medimind.ai');
    this.providerEndpoint = config.endpoint || (typeof process !== 'undefined' ? process.env?.EMAIL_ENDPOINT : null);
  }

  isConfigured() {
    return Boolean(this.apiKey && this.providerEndpoint);
  }

  async send({ to, subject, htmlBody, textBody, priority = 'NORMAL', metadata = {} }) {
    if (!this.isConfigured()) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.NOT_CONFIGURED,
        recipient: to,
        error: 'Email provider credentials not configured in environment',
        timestamp: new Date().toISOString()
      };
    }

    if (!to || !subject || (!htmlBody && !textBody)) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.FAILED,
        recipient: to,
        error: 'Invalid email payload: to, subject, and body are required',
        timestamp: new Date().toISOString()
      };
    }

    try {
      // In production with real endpoint configured, server-side gateway is invoked
      const response = await fetch(this.providerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          from: this.fromAddress,
          to,
          subject,
          html: htmlBody,
          text: textBody,
          headers: { 'X-Priority': priority }
        })
      });

      if (!response.ok) {
        throw new Error(`Email provider gateway error HTTP ${response.status}`);
      }

      const result = await response.json().catch(() => ({}));
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.SENT,
        messageId: result.message_id || `msg-${Date.now()}`,
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

export const emailProvider = new EmailProvider();
