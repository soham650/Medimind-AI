/**
 * MediMind AI — Centralized Clinical Risk Presentation Engine
 * 
 * Provides deterministic, consistent UI presentation across all 4 risk tiers:
 * - LOW: Green presentation (routine home-care & non-medicinal guidance)
 * - MODERATE: Amber/Yellow presentation (schedule regular clinical consultation)
 * - HIGH: Red presentation (urgent clinical review required within 12-24 hours)
 * - CRITICAL: Dark-red/Emergency presentation (immediate emergency triage / 108 ambulance)
 * 
 * Invariants:
 * 1. Health Risk Score is strictly decoupled from ML model confidence.
 * 2. Emergency red-flags can NEVER be downgraded.
 * 3. CRITICAL emergency recommendations always precede routine home care.
 * 4. Product rule (>90% requires doctor recommendation) is framed as advisory routing,
 *    never as an autonomous definitive medical claim.
 */

export const RISK_TIERS = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Normalizes raw triage level and emergency flags into canonical 4-tier model.
 */
export function normalizeRiskTier(rawLevel, isEmergency = false) {
  if (isEmergency) return RISK_TIERS.CRITICAL;
  
  const lower = String(rawLevel || '').toLowerCase().trim();
  if (lower.includes('crit') || lower.includes('emerg') || lower.includes('immediate')) {
    return RISK_TIERS.CRITICAL;
  }
  if (lower.includes('high') || lower.includes('urgent')) {
    return RISK_TIERS.HIGH;
  }
  if (lower.includes('mod') || lower.includes('med')) {
    return RISK_TIERS.MODERATE;
  }
  return RISK_TIERS.LOW;
}

/**
 * Returns centralized color styling and presentation tokens for a given risk tier.
 */
export function getRiskPresentation(riskInput, isEmergency = false, primaryProbability = 0) {
  const tier = typeof riskInput === 'object' && riskInput !== null
    ? normalizeRiskTier(riskInput.triage_level || riskInput.riskLevel || riskInput.risk_level, riskInput.is_emergency || isEmergency)
    : normalizeRiskTier(riskInput, isEmergency);

  // Product rule: primary probability >90% or elevated tier mandates physician routing
  const requiresDoctorConsultation = tier === RISK_TIERS.CRITICAL || tier === RISK_TIERS.HIGH || primaryProbability >= 90;

  switch (tier) {
    case RISK_TIERS.CRITICAL:
      return {
        tier: RISK_TIERS.CRITICAL,
        label: 'Critical / Emergency Risk',
        shortScore: 'Critical Risk',
        hexColor: '#991b1b', // Dark Red
        bannerClass: 'bg-rose-900',
        textClass: 'text-rose-950 font-black',
        pulseColor: 'bg-rose-900',
        badgeBg: 'bg-rose-100 text-rose-950 border border-rose-300',
        cardBorder: 'border-rose-800',
        subText: 'Immediate Emergency Care Directive',
        requiresDoctorConsultation: true,
        priority: 1
      };

    case RISK_TIERS.HIGH:
      return {
        tier: RISK_TIERS.HIGH,
        label: 'High / Urgent Risk',
        shortScore: 'High Risk',
        hexColor: '#dc2626', // Red
        bannerClass: 'bg-red-600',
        textClass: 'text-red-700 font-extrabold',
        pulseColor: 'bg-red-600',
        badgeBg: 'bg-red-50 text-red-700 border border-red-200',
        cardBorder: 'border-red-500',
        subText: 'Urgent Clinical Review Advised',
        requiresDoctorConsultation: true,
        priority: 2
      };

    case RISK_TIERS.MODERATE:
      return {
        tier: RISK_TIERS.MODERATE,
        label: 'Moderate Risk',
        shortScore: 'Moderate Risk',
        hexColor: '#d97706', // Amber / Yellow
        bannerClass: 'bg-amber-500',
        textClass: 'text-amber-700 font-bold',
        pulseColor: 'bg-amber-500',
        badgeBg: 'bg-amber-50 text-amber-800 border border-amber-200',
        cardBorder: 'border-amber-400',
        subText: 'Schedule Consultation within 24-48h',
        requiresDoctorConsultation,
        priority: 3
      };

    case RISK_TIERS.LOW:
    default:
      return {
        tier: RISK_TIERS.LOW,
        label: 'Low Clinical Risk',
        shortScore: 'Low Risk',
        hexColor: '#16a34a', // Green
        bannerClass: 'bg-emerald-600',
        textClass: 'text-emerald-700 font-bold',
        pulseColor: 'bg-emerald-600',
        badgeBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        cardBorder: 'border-emerald-400',
        subText: 'Routine Home Care & Observation',
        requiresDoctorConsultation,
        priority: 4
      };
  }
}

/**
 * Sorts recommendation items ensuring CRITICAL emergency actions appear
 * strictly before ordinary home care, supportive hydration, or routine checkups.
 */
export function sortClinicalRecommendations(recommendations = []) {
  if (!Array.isArray(recommendations)) return [];

  const categoryRank = {
    emergency: 1,
    emergency_advisory: 1,
    doctor_consultation: 2,
    clinical_evaluation: 2,
    monitoring: 3,
    vital_monitoring: 3,
    home_care: 4,
    lifestyle: 5
  };

  return [...recommendations].sort((a, b) => {
    const rankA = categoryRank[a?.category] || 4;
    const rankB = categoryRank[b?.category] || 4;
    return rankA - rankB;
  });
}
