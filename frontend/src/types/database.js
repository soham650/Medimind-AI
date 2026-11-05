/**
 * MediMind AI - Supabase Database Schema Definitions & Enum Types
 */

export const UserRoles = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  PHARMACIST: 'pharmacist',
  ADMIN: 'admin'
};

/**
 * Normalizes any database/legacy role string to one of the 4 canonical application roles:
 * 'patient', 'doctor', 'pharmacist', 'admin'.
 */
export const normalizeRole = (rawRole) => {
  if (!rawRole) return UserRoles.PATIENT;
  const lower = String(rawRole).toLowerCase().trim();
  if (lower === 'admin' || lower === 'super_admin') return UserRoles.ADMIN;
  if (lower === 'pharmacist' || lower === 'pharmacy') return UserRoles.PHARMACIST;
  if (lower === 'doctor') return UserRoles.DOCTOR;
  return UserRoles.PATIENT;
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
