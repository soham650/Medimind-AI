/**
 * MediMind AI — Phase 9 Production Notification Service
 * Consolidated Notification & Communication Service
 * Supports In-App, Real-Time Supabase WebSocket Stream, Multi-Channel Routing,
 * Safe Scoped Preferences, and Admin Communication Health Metrics.
 */

import { supabase } from '../lib/supabaseClient.js';
import { channelRouter } from './communication/channelRouter.js';
import {
  NOTIFICATION_CHANNELS,
  DELIVERY_STATUS,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_CATEGORIES
} from './communication/provider.types.js';
import { emailProvider } from './communication/providers/EmailProvider.js';
import { smsProvider } from './communication/providers/SMSProvider.js';
import { whatsAppProvider } from './communication/providers/WhatsAppProvider.js';
import { pushProvider } from './communication/providers/PushProvider.js';

const DEFAULT_PREFERENCES = Object.freeze({
  appointmentReminders: true,
  prescriptionRefills: true,
  orderUpdates: true,
  aiReportUpdates: true,
  securityAlerts: true, // STRICTLY LOCKED INVARIANT
  criticalHealthAlerts: true, // STRICTLY LOCKED INVARIANT
  channels: {
    in_app: true,
    email: true,
    sms: false,
    whatsapp: false,
    push: true
  }
});

export const notificationService = {
  // --------------------------------------------------------------------------
  // 1. QUERY & LIFECYCLE
  // --------------------------------------------------------------------------

  /**
   * Fetch user notifications with optional filtering
   */
  async getNotifications(userId, options = {}) {
    if (!userId) return [];
    const limit = options.limit || 50;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (options.filter === 'unread') {
      query = query.eq('is_read', false);
    } else if (options.filter === 'read') {
      query = query.eq('is_read', true);
    }

    if (options.type && options.type !== 'all') {
      query = query.or(`type.eq.${options.type},notification_type.eq.${options.type}`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Notification fetch warning:', error.message);
      return [];
    }

    let results = data || [];

    // Client-side priority filter if requested
    if (options.priority && options.priority !== 'all') {
      results = results.filter(n => (n.metadata?.priority || 'NORMAL') === options.priority);
    }

    return results;
  },

  /**
   * Fetch unread notifications count
   */
  async getUnreadCount(userId) {
    if (!userId) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.warn('Unread count fetch warning:', error.message);
      return 0;
    }

    return count || 0;
  },

  /**
   * Mark single notification as read
   */
  async markAsRead(notificationId) {
    if (!notificationId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification read:', error.message);
      throw error;
    }
  },

  /**
   * Mark all notifications read for user
   */
  async markAllAsRead(userId) {
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all read:', error.message);
      throw error;
    }
  },

  // --------------------------------------------------------------------------
  // 2. DISPATCH & CHANNELS
  // --------------------------------------------------------------------------

  /**
   * Dispatches notification via ChannelRouter with idempotency & template engine
   */
  async dispatchNotification(payload) {
    return await channelRouter.dispatch(payload);
  },

  // --------------------------------------------------------------------------
  // 3. REAL-TIME SUBSCRIPTION
  // --------------------------------------------------------------------------

  /**
   * Subscribe to real-time notification stream for authenticated user
   */
  subscribe(userId, onNewNotification) {
    if (!userId || userId.startsWith('00000000-0000')) {
      return () => {};
    }

    try {
      const channel = supabase
        .channel(`user-notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          payload => {
            if (onNewNotification && payload.new) {
              onNewNotification(payload.new);
            }
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch (err) {
      console.warn('Realtime subscription skipped:', err.message);
      return () => {};
    }
  },

  // --------------------------------------------------------------------------
  // 4. PREFERENCES (Scoped, Safe Defaults, Locked Critical Invariants)
  // --------------------------------------------------------------------------

  /**
   * Get user communication preferences.
   * Scoped by authenticated userId, with strictly locked safety defaults.
   */
  getPreferences(userId) {
    if (!userId) return { ...DEFAULT_PREFERENCES };

    try {
      const key = `medimind_notif_prefs_${userId}`;
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
      if (!raw) return { ...DEFAULT_PREFERENCES };

      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PREFERENCES,
        ...parsed,
        // Mandatory Clinical & Account Safety Locks
        securityAlerts: true,
        criticalHealthAlerts: true,
        channels: {
          ...DEFAULT_PREFERENCES.channels,
          ...(parsed.channels || {}),
          in_app: true // In-app is always available
        }
      };
    } catch {
      return { ...DEFAULT_PREFERENCES };
    }
  },

  /**
   * Update user communication preferences.
   * Critical health and security alerts CANNOT be disabled.
   */
  updatePreferences(userId, updates = {}) {
    if (!userId) throw new Error('User ID is required to save notification preferences.');

    const current = this.getPreferences(userId);
    const sanitized = {
      ...current,
      ...updates,
      // Enforce immutability of critical safety alerts
      securityAlerts: true,
      criticalHealthAlerts: true,
      channels: {
        ...current.channels,
        ...(updates.channels || {}),
        in_app: true
      },
      updated_at: new Date().toISOString()
    };

    try {
      const key = `medimind_notif_prefs_${userId}`;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(sanitized));
      }
      return sanitized;
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      return sanitized;
    }
  },

  // --------------------------------------------------------------------------
  // 5. ADMIN TELEMETRY & HEALTH MONITORING
  // --------------------------------------------------------------------------

  /**
   * Aggregates communication health metrics for admin console
   */
  async getAdminCommunicationMetrics() {
    const metrics = {
      totalDispatched: 0,
      delivered: 0,
      failed: 0,
      retrying: 0,
      providers: {
        in_app: { name: 'In-App Realtime', configured: true, status: 'OPERATIONAL' },
        email: { name: 'Email Gateway', configured: emailProvider.isConfigured(), status: emailProvider.isConfigured() ? 'OPERATIONAL' : 'NOT_CONFIGURED' },
        sms: { name: 'SMS Gateway', configured: smsProvider.isConfigured(), status: smsProvider.isConfigured() ? 'OPERATIONAL' : 'NOT_CONFIGURED' },
        whatsapp: { name: 'WhatsApp Business', configured: whatsAppProvider.isConfigured(), status: whatsAppProvider.isConfigured() ? 'OPERATIONAL' : 'NOT_CONFIGURED' },
        push: { name: 'Web Push / APNs', configured: pushProvider.isConfigured(), status: pushProvider.isConfigured() ? 'OPERATIONAL' : 'NOT_CONFIGURED' }
      },
      recentLogs: []
    };

    try {
      // Query audit logs for notification events (accessible via admin RLS)
      const { data: logs, count } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .or('action.eq.NOTIFICATION_DISPATCH,action.eq.NOTIFICATION_BROADCAST_SENT')
        .order('created_at', { ascending: false })
        .limit(20);

      metrics.totalDispatched = count || (logs?.length || 0);
      metrics.recentLogs = logs || [];

      // Count delivered from logs
      if (logs) {
        logs.forEach(l => {
          if (l.action === 'NOTIFICATION_BROADCAST_SENT') {
            metrics.delivered += (l.details?.recipientsCount || 1);
          } else if (l.action === 'NOTIFICATION_DISPATCH') {
            metrics.delivered += 1;
          }
        });
      }
    } catch (err) {
      console.warn('Admin communication telemetry query note:', err.message);
    }

    return metrics;
  }
};
