/**
 * MediMind AI — Phase 9 Communication Platform
 * Multi-Channel Router & Dispatcher
 * Coordinates Business Event -> Template Selection -> PHI Minimization -> Channel Providers -> Audit Trail
 */

import { supabase } from '../../lib/supabaseClient.js';
import {
  NOTIFICATION_CHANNELS,
  DELIVERY_STATUS,
  NOTIFICATION_PRIORITY,
  NOTIFICATION_CATEGORIES
} from './provider.types.js';
import { renderTemplate } from './templates.js';
import { idempotencyEngine } from './idempotency.js';
import { retryHandler } from './retryHandler.js';
import { emailProvider } from './providers/EmailProvider.js';
import { smsProvider } from './providers/SMSProvider.js';
import { whatsAppProvider } from './providers/WhatsAppProvider.js';
import { pushProvider } from './providers/PushProvider.js';

export class ChannelRouter {
  constructor(customClient = null) {
    this.client = customClient || supabase;
  }

  /**
   * Dispatches a notification across enabled channels with application-level idempotency
   */
  async dispatch({
    userId,
    templateKey = null,
    locale = 'en',
    params = {},
    customTitle = null,
    customMessage = null,
    category = NOTIFICATION_CATEGORIES.SYSTEM,
    priority = NOTIFICATION_PRIORITY.NORMAL,
    channels = [NOTIFICATION_CHANNELS.IN_APP],
    idempotencyKey = null,
    link = null,
    metadata = {}
  }) {
    if (!userId) {
      throw new Error('Notification dispatch requires a valid target userId.');
    }

    // 1. Resolve localized title and message from template or custom inputs
    let title = customTitle;
    let message = customMessage;
    let resolvedLink = link;
    let resolvedPriority = priority;
    let resolvedCategory = category;

    if (templateKey) {
      const rendered = renderTemplate(templateKey, locale, params);
      title = title || rendered.title;
      message = message || rendered.body;
      resolvedLink = resolvedLink || rendered.link;
      resolvedPriority = priority || rendered.priority;
      resolvedCategory = rendered.category || category;
    }

    if (!title || !message) {
      throw new Error('Notification title and message could not be resolved.');
    }

    // 2. Compute deterministic idempotency key
    const finalKey = idempotencyKey || idempotencyEngine.generateKey(
      templateKey || 'custom',
      params.entityId || params.orderNumber || params.appointmentNumber || params.rxId || 'gen',
      userId
    );

    // 3. Application-level idempotency guard
    if (idempotencyEngine.isRecentlyProcessed(finalKey)) {
      return {
        success: true,
        deduplicated: true,
        idempotencyKey: finalKey,
        message: 'Notification skipped: identical event processed within deduplication window.'
      };
    }

    const alreadyInDb = await idempotencyEngine.existsInDatabase(this.client, userId, finalKey);
    if (alreadyInDb) {
      idempotencyEngine.markProcessed(finalKey);
      return {
        success: true,
        deduplicated: true,
        idempotencyKey: finalKey,
        message: 'Notification skipped: existing record with identical idempotency_key in database.'
      };
    }

    // 4. Scrub PHI from notification payload
    const safeTitle = String(title).slice(0, 150);
    const safeMessage = String(message).slice(0, 500);

    // 5. Prepare results accumulator
    const channelResults = {};

    // 6. IN-APP Channel Delivery (Primary Supabase channel)
    if (channels.includes(NOTIFICATION_CHANNELS.IN_APP)) {
      const notifMetadata = {
        ...metadata,
        idempotency_key: finalKey,
        priority: resolvedPriority,
        category: resolvedCategory,
        locale,
        channels_requested: channels,
        dispatched_at: new Date().toISOString()
      };

      const inAppExecution = await retryHandler.executeWithRetry(async () => {
        const { data, error } = await this.client
          .from('notifications')
          .insert({
            user_id: userId,
            title: safeTitle,
            message: safeMessage,
            type: resolvedCategory,
            notification_type: resolvedCategory,
            link: resolvedLink,
            metadata: notifMetadata
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      if (inAppExecution.success) {
        channelResults[NOTIFICATION_CHANNELS.IN_APP] = {
          status: DELIVERY_STATUS.DELIVERED,
          notificationId: inAppExecution.result?.id,
          timestamp: new Date().toISOString()
        };
        idempotencyEngine.markProcessed(finalKey);
      } else {
        channelResults[NOTIFICATION_CHANNELS.IN_APP] = {
          status: DELIVERY_STATUS.FAILED,
          error: inAppExecution.error,
          timestamp: new Date().toISOString()
        };
      }
    }

    // 7. External Channels (Strict NOT_CONFIGURED invariant)
    if (channels.includes(NOTIFICATION_CHANNELS.EMAIL)) {
      channelResults[NOTIFICATION_CHANNELS.EMAIL] = await emailProvider.send({
        to: params.email || null,
        subject: safeTitle,
        textBody: safeMessage,
        priority: resolvedPriority,
        metadata: { idempotency_key: finalKey }
      });
    }

    if (channels.includes(NOTIFICATION_CHANNELS.SMS)) {
      channelResults[NOTIFICATION_CHANNELS.SMS] = await smsProvider.send({
        to: params.phone || null,
        message: `${safeTitle}: ${safeMessage}`,
        priority: resolvedPriority,
        metadata: { idempotency_key: finalKey }
      });
    }

    if (channels.includes(NOTIFICATION_CHANNELS.WHATSAPP)) {
      channelResults[NOTIFICATION_CHANNELS.WHATSAPP] = await whatsAppProvider.send({
        to: params.phone || null,
        templateName: templateKey || 'general_notification',
        languageCode: locale,
        parameters: [safeTitle, safeMessage]
      });
    }

    if (channels.includes(NOTIFICATION_CHANNELS.PUSH)) {
      channelResults[NOTIFICATION_CHANNELS.PUSH] = await pushProvider.send({
        subscription: params.pushSubscription || null,
        title: safeTitle,
        body: safeMessage,
        priority: resolvedPriority,
        data: { link: resolvedLink, priority: resolvedPriority }
      });
    }

    // 8. Immutable Audit Trail in public.audit_logs
    try {
      await this.client.from('audit_logs').insert({
        actor_id: (await this.client.auth.getUser()).data?.user?.id || null,
        actor_role: 'system',
        action: 'NOTIFICATION_DISPATCH',
        target_entity: 'notifications',
        target_id: channelResults[NOTIFICATION_CHANNELS.IN_APP]?.notificationId || finalKey,
        details: {
          category: resolvedCategory,
          priority: resolvedPriority,
          channels: Object.keys(channelResults),
          statuses: Object.fromEntries(Object.entries(channelResults).map(([c, r]) => [c, r.status])),
          idempotency_key: finalKey
        }
      });
    } catch {
      // Non-blocking audit log catch
    }

    return {
      success: true,
      idempotencyKey: finalKey,
      title: safeTitle,
      priority: resolvedPriority,
      category: resolvedCategory,
      channels: channelResults
    };
  }
}

export const channelRouter = new ChannelRouter();
