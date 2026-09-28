import type { KycStatus } from '@/api/endpoints/kyc';

/**
 * What is left in the member's current verification stage, named as a person
 * would say it, e.g. "verify your NIN". Empty once fully verified.
 *
 * Read from the stages the server reports (ADR-015); a tier alone does not
 * tell anyone what to do next.
 */
export function outstandingKycSteps(kyc: KycStatus | undefined): string[] {
  if (!kyc) return [];
  if (!kyc.stages) {
    // A server from before staged verification reports steps only.
    const missing: string[] = [];
    if (!kyc.steps.personalDetails.complete) missing.push('your personal details');
    if (!kyc.steps.identity.complete) missing.push('your NIN');
    return missing;
  }
  const current = kyc.stages.find((stage) => stage.stage === kyc.currentStage);
  if (!current) return [];
  return current.requirements
    .filter((item) => item.state === 'missing' || item.state === 'failed')
    .map((item) => item.label.charAt(0).toLowerCase() + item.label.slice(1));
}

/** What a tier means, rather than showing TIER_2. */
export function tierLabel(tier: string): string {
  switch (tier) {
    case 'TIER_1':
      return 'Basic';
    case 'TIER_2':
      return 'Identity verified';
    case 'TIER_3':
      return 'Fully verified';
    default:
      return tier;
  }
}
