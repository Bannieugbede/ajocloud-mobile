import type { AkawoPool, JoinedPool, PoolTotals } from '@/api/endpoints/akawo-pools';
import { sumMinorAmounts } from '@/utils/money';

/**
 * What the Akawo tab owes and has collected, derived rather than computed in a
 * card. A due that is missed because the screen forgot to show it is the whole
 * failure this section exists to prevent, so the arithmetic is tested.
 */

export type OutstandingDue = {
  poolId: string;
  poolName: string;
  amountMinor: string;
  currency: string;
  dueAt: string | null;
};

/**
 * Pools the member still owes, soonest deadline first.
 *
 * A waived due is settled — the organiser has excused it — so it is not owed,
 * and a pool that recorded no due for this member asks for nothing. Only a
 * PENDING or PROCESSING due is money the member still has to find.
 */
export function outstandingDues(joined: readonly JoinedPool[] | undefined): OutstandingDue[] {
  return (joined ?? [])
    .filter((entry) => entry.due?.status === 'PENDING' || entry.due?.status === 'PROCESSING')
    .map((entry) => ({
      poolId: entry.pool.id,
      poolName: entry.pool.name,
      amountMinor: entry.due?.amountMinor ?? entry.pool.amountMinor,
      currency: entry.pool.currency,
      dueAt: entry.pool.dueAt,
    }))
    .sort((a, b) => {
      // A pool with no deadline is not more urgent than one with a date, so it
      // sorts last rather than to the top on an empty string.
      if (a.dueAt === b.dueAt) return a.poolName.localeCompare(b.poolName);
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.localeCompare(b.dueAt);
    });
}

/** What the member owes across every pool, for the banner's total. */
export function totalOutstandingMinor(dues: readonly OutstandingDue[]): string {
  return sumMinorAmounts(dues.map((due) => due.amountMinor));
}

/** Whether a pool still accepts payments. A closed pool is history. */
export function poolIsLive(pool: Pick<AkawoPool, 'status'>): boolean {
  return pool.status === 'OPEN';
}

/**
 * How much of a pool has been collected, phrased for the organiser.
 *
 * Paid members over total members rather than money over money: an organiser
 * chases people, not naira, and "4 of 8 paid" is what tells them who to ring.
 */
export function collectionSummary(pool: PoolTotals): string {
  return `${pool.paidCount} of ${pool.memberCount} paid`;
}

/**
 * A pool's deadline as a member reads it. Not every pool has one — a collection
 * can run until the organiser closes it — so the absence is worded rather than
 * left blank.
 *
 * Formatted in UTC, the frame the deadline is stored in. A deadline is the last
 * instant of its day, and rendering that in local time pushes it onto the next
 * date for anyone east of Greenwich: a pool due the 13th would tell every
 * member in Lagos the 14th, a day of grace nobody agreed to.
 */
export function deadlineLabel(dueAt: string | null, locale?: string): string {
  if (!dueAt) return 'No deadline';
  const parsed = Date.parse(dueAt);
  return Number.isNaN(parsed)
    ? 'No deadline'
    : new Date(parsed).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
        year: 'numeric',
      });
}

/**
 * How far a collection has got, in basis points.
 *
 * The organiser's endpoint returns this figure; the member's does not, so it is
 * derived from the two amounts it does return. Both amounts are minor-unit
 * strings that can exceed `Number.MAX_SAFE_INTEGER`, so the division happens in
 * BigInt and only the small result becomes a number.
 *
 * A pool expecting nothing is not "complete" — there is nothing to complete —
 * so it reports zero rather than dividing by it. Overpayment is capped at 100%
 * so the bar cannot run past its track.
 */
export function progressBps(collectedMinor: string, expectedMinor: string): number {
  let collected: bigint;
  let expected: bigint;
  try {
    collected = BigInt(collectedMinor);
    expected = BigInt(expectedMinor);
  } catch {
    return 0;
  }

  if (expected <= 0n || collected <= 0n) return 0;
  if (collected >= expected) return 10_000;
  return Number((collected * 10_000n) / expected);
}

/**
 * What a pool expects to collect in total.
 *
 * The organiser's endpoint returns this as `expectedMinor`; the member's
 * returns only the per-member amount and the member count. Everyone in a pool
 * pays the same amount — that is the product rule the create form enforces — so
 * the target is exactly the two multiplied, and deriving it here keeps the
 * member's progress bar honest instead of leaving it without a denominator.
 */
export function expectedTotalMinor(amountMinor: string, memberCount: number): string {
  if (!Number.isFinite(memberCount) || memberCount <= 0) return '0';
  try {
    return (BigInt(amountMinor) * BigInt(Math.floor(memberCount))).toString();
  } catch {
    return '0';
  }
}

/**
 * A deadline as a list reads it: "Aug 30", without the year.
 *
 * A card shows three facts side by side and the year is almost never the one
 * that decides anything — the detail screen carries the full date. Formatted in
 * UTC for the same reason as `deadlineLabel`.
 */
export function shortDeadlineLabel(dueAt: string | null, locale?: string): string {
  if (!dueAt) return 'No deadline';
  const parsed = Date.parse(dueAt);
  return Number.isNaN(parsed)
    ? 'No deadline'
    : new Date(parsed).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
      });
}
