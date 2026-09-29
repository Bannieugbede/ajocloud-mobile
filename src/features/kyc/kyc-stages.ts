import type { KycAction, KycStage, KycStageNumber, KycStatus } from '@/api/endpoints/kyc';

/**
 * Staged verification on the device (ajocloud-backend ADR-015).
 *
 * The server enforces every rule here and refuses with `KYC_STAGE_REQUIRED`;
 * the app checks first only so a member is told what to finish before filling
 * in a form the server would refuse. The server's own table, sent with the
 * status, wins over this copy when it is present.
 */
export const KYC_ACTION_STAGES: Record<KycAction, KycStageNumber> = {
  'ajo.join': 1,
  'ajo.contribute': 1,
  'akawo-pool.join': 1,
  'akawo-goal.create': 1,
  'food.subscribe': 1,
  payment: 1,
  withdrawal: 2,
  'wallet.send': 2,
  'ajo.create': 3,
  'ajo.administer': 3,
  'akawo-pool.create': 3,
  'akawo-pool.administer': 3,
  'food-programme.create': 3,
  'food-coordinator.apply': 3,
};

export const STAGE_TITLES: Record<KycStageNumber, string> = {
  1: 'Account',
  2: 'Identity',
  3: 'Address',
};

const ACTION_PHRASES: Record<KycAction, string> = {
  'ajo.join': 'join an Ajo group',
  'ajo.contribute': 'pay contributions',
  'akawo-pool.join': 'join an Akawo pool',
  'akawo-goal.create': 'start an Akawo savings goal',
  'food.subscribe': 'join a food programme',
  payment: 'make payments',
  withdrawal: 'withdraw',
  'wallet.send': 'send money',
  'ajo.create': 'create an Ajo group',
  'ajo.administer': 'manage this group',
  'akawo-pool.create': 'create an Akawo pool',
  'akawo-pool.administer': 'manage this pool',
  'food-programme.create': 'create a food programme',
  'food-coordinator.apply': 'apply as a food coordinator',
};

/** The error code the server refuses a gated action with. */
export const KYC_STAGE_REQUIRED = 'KYC_STAGE_REQUIRED';

export const VERIFICATION_ROUTE = '/(tabs)/profile/verification' as const;

/**
 * Group creation is an admin-only capability: Ajo groups, Akawo pools, and
 * food programmes can only be started by an admin. The gate names the role
 * and sends the member to verification, where approval is handled.
 */
export const ADMIN_CREATE_ACTIONS: ReadonlySet<KycAction> = new Set([
  'ajo.create',
  'akawo-pool.create',
  'food-programme.create',
  'food-coordinator.apply',
]);

export function isAdminCreateAction(action: KycAction): boolean {
  return ADMIN_CREATE_ACTIONS.has(action);
}

export function requiredStage(action: KycAction, status?: KycStatus): KycStageNumber {
  return status?.actions?.[action] ?? KYC_ACTION_STAGES[action];
}

export function canPerform(action: KycAction, status: KycStatus): boolean {
  if (status.level === undefined) return true;
  return !status.restricted && status.level >= requiredStage(action, status);
}

/** "Complete stage 2 (Identity) to withdraw." */
export function lockedMessage(action: KycAction, status?: KycStatus): string {
  if (status?.restricted) {
    return 'Your verification was not approved. Contact support to continue.';
  }
  if (isAdminCreateAction(action)) {
    return 'Only admins can create groups. Apply to become an admin to start an Ajo group, an Akawo pool, or a food programme.';
  }
  const stage = requiredStage(action, status);
  return `Complete stage ${stage} (${STAGE_TITLES[stage]}) verification to ${ACTION_PHRASES[action]}.`;
}

/** Plain words for a stage's state, never colour alone. */
export function stageStatusLabel(status: KycStage['status']): string {
  switch (status) {
    case 'complete':
      return 'Complete';
    case 'in_progress':
      return 'In progress';
    case 'under_review':
      return 'Under review';
    case 'locked':
      return 'Locked';
  }
}
