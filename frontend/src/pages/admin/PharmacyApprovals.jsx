import React from 'react';
import PharmacyVerification from './PharmacyVerification';

/**
 * Backward-compatible alias for PharmacyVerification
 * Directs /admin/pharmacy-approvals to the verified PharmacyVerification component
 */
export default function PharmacyApprovals() {
  return <PharmacyVerification />;
}
