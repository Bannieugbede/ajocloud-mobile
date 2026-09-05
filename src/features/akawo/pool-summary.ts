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
