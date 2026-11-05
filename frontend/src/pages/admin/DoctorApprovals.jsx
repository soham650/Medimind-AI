import React from 'react';
import DoctorVerification from './DoctorVerification';

/**
 * Backward-compatible alias for DoctorVerification
 * Directs /admin/doctor-approvals to the verified DoctorVerification component
 */
export default function DoctorApprovals() {
  return <DoctorVerification />;
}
