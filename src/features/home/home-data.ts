import type { AjoCycle, AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import type { AkawoGoal } from '@/api/endpoints/akawo';
import type { BillPayment } from '@/api/endpoints/bill-payments';
import { sumMinorAmounts } from '@/utils/money';

/**
 * Everything the home screen shows, derived from what the API actually returns.
 *
 * Kept apart from the component so the arithmetic and the ordering can be
 * tested without rendering: a wrong total or a stale "due soon" is a money bug,
 * and it should be provable in a unit test rather than inspected by eye.
 */

/** Milliseconds in a day, for the windows below. */
const DAY_MS = 86_400_000;

/**
 * How far ahead the upcoming list looks. Beyond this a contribution is real but
 * not yet actionable, and listing it crowds out the ones that are.
 */
export const UPCOMING_WINDOW_DAYS = 45;

/** Within this many days a contribution is called out as due soon. */
export const DUE_SOON_DAYS = 3;

export type UpcomingKind = 'CONTRIBUTION' | 'PAYOUT' | 'POOL_DUE';

export type UpcomingItem = {
  /** Stable across refetches so React keys do not churn. */
  id: string;
  kind: UpcomingKind;
  groupId: string;
  groupName: string;
  /** Which product the row belongs to, shown beside the date. */
  product?: 'Ajo' | 'Akawo';
  amountMinor: string;
  currency: string;
  dueAt: string;
  /** Set only for contributions, which are the rows a payment settles. */
  scheduleId?: string;
  urgency: 'OVERDUE' | 'DUE_SOON' | 'SCHEDULED';
};

/**
 * Total saved across Akawo goals.
 *
 * Only goals still holding money count. A closed or cancelled goal has been
 * paid out, and including it would overstate what the member actually has.
 */
export function totalAkawoSaved(goals: readonly AkawoGoal[] | undefined): string {
  if (!goals?.length) return '0';
  return sumMinorAmounts(
    goals
      .filter((goal) => goal.status !== 'CLOSED' && goal.status !== 'CANCELLED')
      .map((goal) => goal.savedMinor),
  );
}

/**
 * How urgent a due date is, relative to `now`.
 *
 * `now` is passed in rather than read here so the boundary between "due soon"
 * and "scheduled" can be tested exactly instead of depending on when the suite
 * happens to run.
 */
export function urgencyFor(dueAt: string, now: Date): UpcomingItem['urgency'] {
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return 'SCHEDULED';
  const elapsed = due - now.getTime();
  if (elapsed < 0) return 'OVERDUE';
  return elapsed <= DUE_SOON_DAYS * DAY_MS ? 'DUE_SOON' : 'SCHEDULED';
}

/**
 * The member's own unpaid contributions and expected payouts, soonest first.
 *
 * A cycle's schedules are scoped by role on the backend — an admin receives
 * every member's rows — so contributions are filtered to the viewer's own slots
 * rather than trusted wholesale. Without that, a group admin would be shown the
 * whole group's obligations as though they were personally due.
 */
export function buildUpcoming(
  entries: readonly {
    group: AjoGroupSummary;
    cycles: readonly AjoCycle[];
    /** Slot ids belonging to the viewer in this group. */
    mySlotIds: readonly string[];
  }[],
  now: Date,
): UpcomingItem[] {
  const horizon = now.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS;
  const items: UpcomingItem[] = [];

  for (const { group, cycles, mySlotIds } of entries) {
    const mine = new Set(mySlotIds);
    for (const cycle of cycles) {
      for (const row of cycle.contributionSchedules) {
        if (!mine.has(row.slotId) || row.status === 'PAID') continue;
        if (!withinHorizon(cycle.contributionDueAt, horizon)) continue;
        items.push({
          id: `contribution:${row.id}`,
          kind: 'CONTRIBUTION',
          groupId: group.id,
          groupName: group.name,
          product: 'Ajo',
          // What is still owed, so a part-paid round shows its remainder rather
          // than asking for the full amount a second time.
          amountMinor: remainderMinor(row.amountDueMinor, row.amountPaidMinor),
          currency: row.currency,
          dueAt: cycle.contributionDueAt,
          scheduleId: row.id,
          urgency: urgencyFor(cycle.contributionDueAt, now),
        });
      }

      for (const row of cycle.payoutSchedules) {
        if (!mine.has(row.slotId) || row.status === 'PAID') continue;
        if (!withinHorizon(cycle.payoutDueAt, horizon)) continue;
        items.push({
          id: `payout:${row.id}`,
          kind: 'PAYOUT',
          groupId: group.id,
          groupName: group.name,
          product: 'Ajo',
          amountMinor: row.amountDueMinor,
          currency: row.currency,
          dueAt: cycle.payoutDueAt,
          // Money arriving is never overdue or urgent — it is simply expected.
          urgency: 'SCHEDULED',
        });
      }
    }
  }

  return items.sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id));
}

/**
 * Akawo pool dues the member still owes, as upcoming rows.
 *
 * A pool due belongs on this list for the same reason a contribution does: it
 * is money owed by a date. Only PENDING and PROCESSING count — a waived due has
 * been excused by the organiser, and a paid one is finished.
 *
 * A pool with no deadline is still owed, so it is kept rather than filtered out
 * by the horizon that only applies to dated rows.
 */
export function poolDuesAsUpcoming(
  joined:
    | readonly {
        pool: {
          id: string;
          name: string;
          amountMinor: string;
          currency: string;
          dueAt: string | null;
        };
        due: { id: string; amountMinor: string; status: string } | null;
      }[]
    | undefined,
  now: Date,
): UpcomingItem[] {
  const horizon = now.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS;

  return (joined ?? [])
    .filter((entry) => entry.due?.status === 'PENDING' || entry.due?.status === 'PROCESSING')
    .filter((entry) => !entry.pool.dueAt || withinHorizon(entry.pool.dueAt, horizon))
    .map((entry) => ({
      id: `pool-due:${entry.due?.id ?? entry.pool.id}`,
      kind: 'POOL_DUE' as const,
      groupId: entry.pool.id,
      groupName: entry.pool.name,
      product: 'Akawo' as const,
      amountMinor: entry.due?.amountMinor ?? entry.pool.amountMinor,
      currency: entry.pool.currency,
      // An undated due sorts to the end rather than to the top on an empty
      // string, which would make it look like the most urgent thing owed.
      dueAt: entry.pool.dueAt ?? '',
      urgency: entry.pool.dueAt ? urgencyFor(entry.pool.dueAt, now) : ('SCHEDULED' as const),
    }));
}

/** Merges every upcoming obligation into one list, soonest first. */
export function mergeUpcoming(...lists: readonly UpcomingItem[][]): UpcomingItem[] {
  return lists.flat().sort((a, b) => {
    // An undated row sorts last: no deadline is not the same as due today.
    if (!a.dueAt && !b.dueAt) return a.id.localeCompare(b.id);
    if (!a.dueAt) return 1;
    if (!b.dueAt) return -1;
    return a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id);
  });
}

function withinHorizon(dueAt: string, horizon: number): boolean {
  const due = Date.parse(dueAt);
  return Number.isNaN(due) ? false : due <= horizon;
}

/** What remains on a schedule, never below zero. */
function remainderMinor(dueMinor: string, paidMinor: string): string {
  const due = toBigInt(dueMinor);
  const paid = toBigInt(paidMinor);
  const remaining = due - paid;
  return (remaining > 0n ? remaining : 0n).toString();
}

function toBigInt(value: string): bigint {
  return /^-?\d+$/.test(value.trim()) ? BigInt(value.trim()) : 0n;
}

export type QuickPayItem = {
  billerName: string;
  /** Names the icon and gives the reference a label. Null on older payments. */
  categoryName: string | null;
  customerReferenceMasked: string;
  amountMinor: string;
  currency: string;
  paymentId: string;
};

/**
 * Billers worth offering again, newest first.
 *
 * There is no saved-beneficiary API, so this is derived from payment history —
 * only payments that actually completed, because re-offering a failed one
 * suggests it worked. One entry per customer reference: paying the same meter
 * monthly should occupy one row, not twelve.
 */
export function recentQuickPay(
  payments: readonly BillPayment[] | undefined,
  limit = 2,
): QuickPayItem[] {
  if (!payments?.length) return [];

  const newestFirst = [...payments]
    // SUCCESSFUL only: re-offering a failed or reversed payment implies it
    // worked. This is the exact value the backend's BillPaymentStatus uses.
    .filter((payment) => payment.status === 'SUCCESSFUL')
    .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt));

  const seen = new Set<string>();
  const items: QuickPayItem[] = [];
  for (const payment of newestFirst) {
    if (seen.has(payment.customerReferenceMasked)) continue;
    seen.add(payment.customerReferenceMasked);
    items.push({
      // The biller's name, which is what a person recognises. The verified
      // customer name and the masked reference are fallbacks for a payment
      // made before the API returned the biller.
      billerName:
        payment.biller?.name ?? payment.verifiedCustomerName ?? payment.customerReferenceMasked,
      categoryName: payment.biller?.category.name ?? null,
      customerReferenceMasked: payment.customerReferenceMasked,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      paymentId: payment.id,
    });
    if (items.length === limit) break;
  }
  return items;
}

/** The greeting for the time of day, as a person would say it. */
export function greetingFor(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  return hour < 18 ? 'Good afternoon' : 'Good evening';
}

/**
 * A due date phrased relative to today, falling back to the date itself.
 *
 * "in 2 days" is how the deadline is actually understood; the absolute date is
 * still shown alongside it by the screen, so this never has to carry the whole
 * meaning on its own.
 */
export function relativeDueLabel(dueAt: string, now: Date): string {
  const due = Date.parse(dueAt);
  if (Number.isNaN(due)) return '';

  const days = Math.round((startOfDay(new Date(due)) - startOfDay(now)) / DAY_MS);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * The tone a bill category is drawn in.
 *
 * The design gives each category its own colour so the row is scannable at a
 * glance rather than four identical blue tiles. These are semantic token names
 * rather than raw values, so both themes resolve them correctly — the screen
 * looks them up against the palette.
 */
export type CategoryTone = 'warning' | 'info' | 'secondary' | 'primary';

export function categoryTone(name: string): CategoryTone {
  const lower = name.toLowerCase();
  if (lower.includes('electric') || lower.includes('power')) return 'warning';
  if (lower.includes('water')) return 'info';
  if (lower.includes('tv') || lower.includes('cable')) return 'secondary';
  return 'primary';
}

/** The icon a bill category is drawn with, matching its tone. */
export function categoryIcon(
  name: string,
): 'flash-outline' | 'water-outline' | 'tv-outline' | 'wifi-outline' | 'receipt-outline' {
  const lower = name.toLowerCase();
  if (lower.includes('electric') || lower.includes('power')) return 'flash-outline';
  if (lower.includes('water')) return 'water-outline';
  if (lower.includes('tv') || lower.includes('cable')) return 'tv-outline';
  if (lower.includes('internet') || lower.includes('data')) return 'wifi-outline';
  return 'receipt-outline';
}
