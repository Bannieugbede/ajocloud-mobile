import type { WalletTransaction } from '@/api/endpoints/wallets';
import { sumMinorAmounts } from '@/utils/money';

/**
 * How the wallet's ledger entries are grouped, totalled and worded.
 *
 * Kept out of the screen because the two totals at the top are a claim about
 * someone's money: if they disagree with the rows beneath them, the screen is
 * lying about where the money went.
 */

export type MovementFilter = 'all' | 'in' | 'out';

/** The product a movement belongs to, which decides its icon and tint. */
export type MovementCategory = 'wallet' | 'ajo' | 'food' | 'akawo' | 'bill' | 'transfer' | 'other';

export const MOVEMENT_FILTERS: readonly { value: MovementFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in', label: 'Money In' },
  { value: 'out', label: 'Money Out' },
];

/**
 * Which product a movement came from.
 *
 * The ledger returns a free-text description rather than a typed category, so
 * this reads it. Order matters: "Food Ajo" contains "Ajo", so food is tested
 * first or every food package would be filed as a rotating-savings payment.
 *
 * Anything unrecognised is `other` and still lists normally — a movement that
 * cannot be categorised must never be hidden, because it is still someone's
 * money.
 */
export function categoryOf(movement: WalletTransaction): MovementCategory {
  const text = movement.transaction.description.toLowerCase();

  if (text.includes('food')) return 'food';
  if (text.includes('akawo') || text.includes('pool')) return 'akawo';
  if (text.includes('ajo') || text.includes('contribution') || text.includes('payout')) {
    return 'ajo';
  }
  if (
    text.includes('airtime') ||
    text.includes('data') ||
    text.includes('electricity') ||
    text.includes('cable') ||
    text.includes('bill') ||
    text.includes('subscription')
  ) {
    return 'bill';
  }
  if (text.includes('transfer') || text.includes('sent') || text.includes('received')) {
    return 'transfer';
  }
  if (text.includes('fund') || text.includes('top') || text.includes('withdraw')) return 'wallet';
  return 'other';
}

const CATEGORY_ICONS: Record<MovementCategory, string> = {
  wallet: 'wallet-outline',
  ajo: 'people-outline',
  food: 'restaurant-outline',
  akawo: 'clipboard-outline',
  bill: 'flash-outline',
  transfer: 'swap-horizontal-outline',
  other: 'ellipse-outline',
};

export function categoryIcon(category: MovementCategory): string {
  return CATEGORY_ICONS[category];
}

/** Whether money came in. CREDIT is a credit to the member's wallet. */
export function isMoneyIn(movement: WalletTransaction): boolean {
  return movement.direction === 'CREDIT';
}

export function matchesFilter(movement: WalletTransaction, filter: MovementFilter): boolean {
  if (filter === 'all') return true;
  return filter === 'in' ? isMoneyIn(movement) : !isMoneyIn(movement);
}

export function filterMovements(
  movements: readonly WalletTransaction[] | undefined,
  filter: MovementFilter,
): WalletTransaction[] {
  return (movements ?? []).filter((movement) => matchesFilter(movement, filter));
}

/**
 * What actually moved, in each direction.
 *
 * Only a successful movement counts. A pending or failed transaction has not
 * moved money, and adding it to "total in" would tell someone they have been
 * paid when they have not. The comparison is case-insensitive because the
 * ledger's status casing is not part of any contract.
 */
export function settledTotals(movements: readonly WalletTransaction[] | undefined): {
  inMinor: string;
  outMinor: string;
} {
  const settled = (movements ?? []).filter(
    (movement) => movement.transaction.status.toUpperCase() === 'SUCCESSFUL',
  );

  return {
    inMinor: sumMinorAmounts(settled.filter(isMoneyIn).map((entry) => entry.amountMinor)),
    outMinor: sumMinorAmounts(
      settled.filter((entry) => !isMoneyIn(entry)).map((e) => e.amountMinor),
    ),
  };
}

/** The signed amount as it is read, e.g. "+₦50,000.00". */
export function signedAmountLabel(movement: WalletTransaction, formatted: string): string {
  return `${isMoneyIn(movement) ? '+' : '−'}${formatted}`;
}

/**
 * When a movement happened. Uses the posted time where the ledger has one —
 * that is when the money actually moved — and falls back to when the entry was
 * created.
 */
export function movementTimeLabel(movement: WalletTransaction, locale?: string): string {
  const source = movement.transaction.postedAt ?? movement.createdAt;
  const parsed = Date.parse(source);
  if (Number.isNaN(parsed)) return 'Date unavailable';

  const date = new Date(parsed);
  const day = date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const time = date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}
