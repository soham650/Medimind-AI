/**
 * MediMind AI — Phase 9 Communication Platform
 * WhatsApp Provider Abstraction
 * Supports pre-approved transactional templates, strict NOT_CONFIGURED status, and no fake delivery.
 */

import { DELIVERY_STATUS, NOTIFICATION_CHANNELS } from '../provider.types.js';

export class WhatsAppProvider {
  constructor(config = {}) {
    this.name = 'whatsapp';
    this.channel = NOTIFICATION_CHANNELS.WHATSAPP;
    this.apiKey = config.apiKey || (typeof process !== 'undefined' ? process.env?.WHATSAPP_API_KEY : null);
    this.businessAccountId = config.businessAccountId || (typeof process !== 'undefined' ? process.env?.WHATSAPP_ACCOUNT_ID : null);
    this.endpoint = config.endpoint || (typeof process !== 'undefined' ? process.env?.WHATSAPP_ENDPOINT : null);
  }

  isConfigured() {
    return Boolean(this.apiKey && this.businessAccountId && this.endpoint);
  }

  async send({ to, templateName, languageCode = 'en', parameters = [], metadata = {} }) {
    if (!this.isConfigured()) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.NOT_CONFIGURED,
        recipient: to,
        error: 'WhatsApp Business API credentials not configured in environment',
        timestamp: new Date().toISOString()
      };
    }

    if (!to || !templateName) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.FAILED,
        recipient: to,
        error: 'Invalid WhatsApp payload: recipient phone and template name are required',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: { code: languageCode },
            components: [
              {
                type: 'body',
                parameters: parameters.map(p => ({ type: 'text', text: String(p) }))
              }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error HTTP ${response.status}`);
      }

      const resJson = await response.json().catch(() => ({}));
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.SENT,
        messageId: resJson.messages?.[0]?.id || `wa-${Date.now()}`,
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

export const whatsAppProvider = new WhatsAppProvider();
