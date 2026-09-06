import type { AkawoDue, AkawoPoolMember } from '@/api/endpoints/akawo-pools';
import { dateAndTime } from '@/utils/dates';

/**
 * How a pool's payments are counted and worded.
 *
 * The organiser's tiles and every status pill read from here, so a member
 * counted as paid in the summary can never be drawn as pending in the list
 * beneath it — the two disagreeing is the failure this module exists to stop.
 */

export type DueTone = 'success' | 'warning' | 'info' | 'neutral';

/**
 * The tiles above the member list.
 *
 * Waived members are deliberately absent from all three: the organiser has
 * excused them, so they are neither owing nor money collected, and counting
 * them as either would misstate what is still to come in. The list below still
 * shows them individually.
 */
export type PoolTally = {
  paid: number;
  pending: number;
  processing: number;
  waived: number;
};

export function tallyMembers(members: readonly AkawoPoolMember[]): PoolTally {
  const tally: PoolTally = { paid: 0, pending: 0, processing: 0, waived: 0 };

  for (const member of members) {
    // A removed member is no longer part of the collection and must not be
    // counted against it; their row is filtered out of the list too.
    if (member.status === 'REMOVED') continue;

    switch (member.due?.status) {
      case 'PAID':
        tally.paid += 1;
        break;
      case 'PROCESSING':
        tally.processing += 1;
        break;
      case 'WAIVED':
        tally.waived += 1;
        break;
      // A member with no due recorded still owes the pool amount, so they are
      // pending rather than uncounted.
      default:
        tally.pending += 1;
    }
  }

  return tally;
}

/** Members who count towards the collection, in the order the list shows them. */
export function activeMembers(members: readonly AkawoPoolMember[]): AkawoPoolMember[] {
  return members.filter((member) => member.status !== 'REMOVED');
}

/** How a due reads on a pill. A member with no due yet still owes the amount. */
export function dueLabel(due: AkawoDue | null): string {
  switch (due?.status) {
    case 'PAID':
      return 'Paid';
    case 'PROCESSING':
      return 'Processing';
    case 'WAIVED':
      return 'Waived';
    default:
      return 'Pending';
  }
}

export function dueTone(due: AkawoDue | null): DueTone {
  switch (due?.status) {
    case 'PAID':
      return 'success';
    case 'PROCESSING':
      return 'info';
    case 'WAIVED':
      return 'neutral';
    default:
      return 'warning';
  }
}

/**
 * What a member has actually paid, for the amount column.
 *
 * Only a settled payment is money in. Anything else shows zero rather than the
 * expected amount, so the column never implies a payment that has not landed.
 */
export function paidAmountMinor(due: AkawoDue | null): string {
  return due?.status === 'PAID' ? due.amountMinor : '0';
}

/** When a payment landed, or null when it has not. */
export function paidAtLabel(due: AkawoDue | null, locale?: string): string | null {
  return due?.status === 'PAID' ? dateAndTime(due.paidAt, locale) : null;
}
