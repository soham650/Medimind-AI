/**
 * MediMind AI — Phase 9 Communication Platform
 * Core Type Definitions & Enumerations
 * Strict zero-mock, minimum necessary data, and HIPAA-compliant delivery contracts.
 */

export const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  WHATSAPP: 'whatsapp',
  PUSH: 'push'
});

export const DELIVERY_STATUS = Object.freeze({
  QUEUED: 'QUEUED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RETRYING: 'RETRYING',
  NOT_CONFIGURED: 'NOT_CONFIGURED'
});

export const NOTIFICATION_PRIORITY = Object.freeze({
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
});

export const NOTIFICATION_CATEGORIES = Object.freeze({
  APPOINTMENT: 'appointment',
  PRESCRIPTION: 'prescription',
  ORDER: 'order',
  REPORT: 'report',
  CLINICAL_ALERT: 'alert',
  VERIFICATION: 'verification',
  SECURITY: 'security',
  SYSTEM: 'system'
});

export const SUPPORTED_LOCALES = Object.freeze(['en', 'hi', 'mr']);
