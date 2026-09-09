/**
 * MediMind AI - Supabase Database Schema Definitions & Enum Types
 */

export const UserRoles = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  PHARMACIST: 'pharmacist',
  PHARMACY: 'pharmacy',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
};

export const AppointmentStatuses = {
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

export const OrderStatuses = {
  PENDING: 'pending',
  PRESCRIPTION_REVIEW: 'prescription_review',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  DISPATCHED: 'dispatched',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const VerificationStatuses = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const NotificationTypes = {
  APPOINTMENT: 'appointment',
  PRESCRIPTION: 'prescription',
  ORDER: 'order',
  ALERT: 'alert',
  SYSTEM: 'system'
};
