/**
 * MediMind AI — Phase 9 Communication Platform
 * Push Notification Provider Abstraction
 * Supports Web Push / FCM / APNs boundary.
 * Returns NOT_CONFIGURED when device subscription or push credentials are absent.
 */

import { DELIVERY_STATUS, NOTIFICATION_CHANNELS } from '../provider.types.js';

export class PushProvider {
  constructor(config = {}) {
    this.name = 'push';
    this.channel = NOTIFICATION_CHANNELS.PUSH;
    this.vapidPublicKey = config.vapidPublicKey || (typeof process !== 'undefined' ? process.env?.VAPID_PUBLIC_KEY : null);
    this.pushServerEndpoint = config.endpoint || (typeof process !== 'undefined' ? process.env?.PUSH_SERVER_ENDPOINT : null);
  }

  isConfigured() {
    return Boolean(this.vapidPublicKey && this.pushServerEndpoint);
  }

  async send({ subscription, title, body, icon = '/favicon.ico', data = {}, priority = 'NORMAL' }) {
    if (!this.isConfigured() || !subscription) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.NOT_CONFIGURED,
        error: !subscription ? 'No active device push subscription available' : 'Push server credentials not configured',
        timestamp: new Date().toISOString()
      };
    }

    if (!title || !body) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.FAILED,
        error: 'Push notifications require title and body',
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(this.pushServerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          payload: {
            title,
            body,
            icon,
            data,
            urgency: priority === 'CRITICAL' ? 'high' : 'normal'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Push delivery error HTTP ${response.status}`);
      }

      return {
        channel: this.channel,
        status: DELIVERY_STATUS.SENT,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        channel: this.channel,
        status: DELIVERY_STATUS.FAILED,
        error: err.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const pushProvider = new PushProvider();
