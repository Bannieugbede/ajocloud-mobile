import type { KycStatus } from '@/api/endpoints/kyc';

/**
 * The verification steps still outstanding, named as a person would say them.
 *
 * Derived from `steps` rather than read from a field: the API reports each
 * step's completion, not a list, and a tier alone does not tell anyone what to
 * do next.
 */
export function outstandingKycSteps(kyc: KycStatus | undefined): string[] {
  if (!kyc) return [];
  const missing: string[] = [];
  if (!kyc.steps.personalDetails.complete) missing.push('your personal details');
  if (!kyc.steps.identity.complete) missing.push('your BVN or NIN');
  if (!kyc.steps.bankAccount.complete) missing.push('a bank account');
  return missing;
}

/** What a tier means, rather than showing TIER_2. */
export function tierLabel(tier: string): string {
  switch (tier) {
    case 'TIER_1':
      return 'Basic';
    case 'TIER_2':
      return 'Verified';
    case 'TIER_3':
      return 'Fully verified';
    default:
      return tier;
  }
}
