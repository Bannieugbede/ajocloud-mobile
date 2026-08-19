/**
 * The account-creation journey, in order. Steps after `verify-email` are
 * onboarding rather than authentication: the account already exists and has a
 * session, so a user who drops out here can finish later from Profile.
 */
export const REGISTRATION_STEPS = [
  'details',
  'verify-email',
  'create-pin',
  'confirm-pin',
  'biometrics',
  'identity-intro',
  'personal-details',
  'identity-document',
  'bank-account',
  'identity-complete',
  'intent',
] as const;

export type RegistrationStep = (typeof REGISTRATION_STEPS)[number];

/** Steps that make up the identity-verification detour, skippable as a block. */
export const IDENTITY_STEPS: readonly RegistrationStep[] = [
  'identity-intro',
  'personal-details',
  'identity-document',
  'bank-account',
  'identity-complete',
];

/**
 * Position shown to the user. Identity steps are deliberately excluded from the
 * count: they are optional, so including them would misreport how much is left
 * for someone who intends to skip.
 */
export const CORE_STEPS: readonly RegistrationStep[] = [
  'details',
  'verify-email',
  'create-pin',
  'confirm-pin',
  'biometrics',
];

export function coreStepPosition(step: RegistrationStep): { index: number; total: number } | null {
  const index = CORE_STEPS.indexOf(step);
  if (index === -1) return null;
  return { index: index + 1, total: CORE_STEPS.length };
}

/** Where to go when identity verification is skipped at any point. */
export const SKIP_IDENTITY_TARGET: RegistrationStep = 'intent';
