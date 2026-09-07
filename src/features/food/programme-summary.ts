import type {
  FoodCoordinatorApplication,
  FoodProgramme,
  FoodSubscription,
} from '@/api/endpoints/food-ajo';

/**
 * What the Food tab says about a programme, derived rather than rendered
 * inline. Enrolment arithmetic decides whether someone can still join, so it
 * belongs where it can be tested rather than inside a card.
 */

/**
 * Places still open on a programme, never below zero.
 *
 * Each portion consumes a place, so a member taking two takes two — counting
 * subscriptions rather than portions would show room that does not exist. The
 * backend counts the same way when it accepts an enrolment.
 */
export function placesLeft(programme: Pick<FoodProgramme, 'enrolmentCapacity' | '_count'>): number {
  return Math.max(0, programme.enrolmentCapacity - programme._count.subscriptions);
}

/** How full a programme is, in basis points. */
export function enrolmentProgressBps(
  programme: Pick<FoodProgramme, 'enrolmentCapacity' | '_count'>,
): number {
  if (programme.enrolmentCapacity <= 0) return 0;
  const filled = Math.round(
    (programme._count.subscriptions / programme.enrolmentCapacity) * 10_000,
  );
  return Math.max(0, Math.min(10_000, filled));
}

/** How a programme is handed over, phrased as a person would say it. */
export function fulfilmentLabel(method: string): string {
  switch (method) {
    case 'PICKUP':
      return 'Pickup';
    case 'DELIVERY':
      return 'Delivery';
    case 'DELIVERY_OR_PICKUP':
      return 'Delivery or pickup';
    default:
      return method.toLowerCase().replace(/_/g, ' ');
  }
}

export type CoordinatorInvitation = {
  title: string;
  description: string;
  /** False once an application exists: applying twice helps nobody. */
  canApply: boolean;
};

/**
 * What the coordinator banner should say, given any applications already made.
 *
 * A member who has applied needs to know where that application stands, not to
 * be invited again — an invitation shown to someone already waiting reads as
 * though their application was lost.
 */
export function coordinatorInvitation(
  applications: readonly FoodCoordinatorApplication[] | undefined,
): CoordinatorInvitation {
  const latest = [...(applications ?? [])].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];

  if (!latest) {
    return {
      title: 'Become a coordinator',
      description: 'Manage food packages and earn coordinator fees',
      canApply: true,
    };
  }

  switch (latest.status) {
    case 'APPROVED':
      return {
        title: 'You are a coordinator',
        description: 'You can run programmes and manage distribution',
        canApply: false,
      };
    case 'REJECTED':
      return {
        title: 'Coordinator application declined',
        description: 'You can apply again with updated details',
        canApply: true,
      };
    case 'DRAFT':
      return {
        title: 'Finish your coordinator application',
        description: 'Your application has not been submitted yet',
        canApply: true,
      };
    default:
      return {
        title: 'Coordinator application in review',
        description: 'We will let you know once a decision is made',
        canApply: false,
      };
  }
}

/** Whether a member's enrolment still stands. A cancelled one lets them rejoin. */
export function isEnrolled(subscription: FoodSubscription | null | undefined): boolean {
  return subscription?.status === 'PENDING' || subscription?.status === 'ACTIVE';
}

/**
 * Whether a programme is still taking members.
 *
 * `ACTIVE` means buying has started, so a late joiner would not be in what was
 * ordered — the programme is running, but not open.
 */
export function acceptsNewMembers(
  programme: Pick<FoodProgramme, 'status' | 'enrolmentCapacity' | '_count'>,
): boolean {
  return programme.status === 'OPEN' && placesLeft(programme) > 0;
}

/**
 * Why a programme cannot be joined, or null when it can.
 *
 * A disabled button with no reason beside it is the thing people complain
 * about, so the reason is always available to render.
 */
export function joinBlockedReason(
  programme: Pick<FoodProgramme, 'status' | 'enrolmentCapacity' | '_count'>,
): string | null {
  if (placesLeft(programme) <= 0) return 'Every spot in this programme has been taken.';
  if (programme.status === 'OPEN') return null;
  if (programme.status === 'ACTIVE') {
    return 'Buying has already started for this programme, so it is no longer taking members.';
  }
  return 'This programme is not taking new members.';
}

/** The price per portion, worded with how often it is contributed. */
export function priceLabel(
  programme: Pick<FoodProgramme, 'contributionMinor' | 'currency' | 'contributionFrequency'>,
  format: (amountMinor: string, currency: string) => string,
): string {
  const amount = format(programme.contributionMinor, programme.currency);
  const frequency = programme.contributionFrequency
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());
  return `${amount} / ${frequency}`;
}
