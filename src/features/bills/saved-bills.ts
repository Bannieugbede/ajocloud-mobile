import type { Ionicons } from '@expo/vector-icons';

import type { BillPayment } from '@/api/endpoints/bill-payments';

// Re-exported rather than redefined: two functions naming the same field would
// eventually disagree, and a smart card labelled "Reference" on one screen and
// "Smartcard number" on another reads as two different fields.
export { referenceLabel } from './bill-amount';

/**
 * The bills someone pays regularly, derived from what they have already paid.
 *
 * There is no beneficiaries endpoint, so "saved" here means "paid before and
 * settled". That is a better definition than a list someone has to curate:
 * nobody maintains a list of their own bills, but everybody pays the same ones
 * every month.
 *
 * Only successful payments count. Offering to repeat a payment that failed
 * would suggest the last one worked.
 */

export type SavedBill = {
  /** The most recent successful payment to this biller and reference. */
  readonly paymentId: string;
  readonly billerId: string;
  readonly billerName: string;
  readonly categoryId: string;
  readonly categoryName: string;
  /** Masked by the server; the raw reference never reaches the app. */
  readonly referenceMasked: string;
  /** What was last paid, offered as the amount to repeat. */
  readonly amountMinor: string;
  readonly currency: string;
  readonly paidAt: string;
};

const SUCCESSFUL = 'SUCCESSFUL';

/**
 * The distinct biller-and-reference pairs someone has paid, most recent first.
 *
 * One entry per pair rather than per payment: three months of DSTV is one bill
 * to pay again, not three.
 */
export function savedBills(payments: readonly BillPayment[] = [], limit = 5): SavedBill[] {
  const seen = new Map<string, SavedBill>();

  for (const payment of [...payments].sort(byNewest)) {
    if (payment.status !== SUCCESSFUL) continue;
    const biller = payment.biller;
    if (!biller) continue;

    const key = `${biller.id}:${payment.customerReferenceMasked}`;
    // The sort put the newest first, so the first one seen is the one to keep.
    if (seen.has(key)) continue;

    seen.set(key, {
      paymentId: payment.id,
      billerId: biller.id,
      billerName: biller.name,
      categoryId: biller.category.id,
      categoryName: biller.category.name,
      referenceMasked: payment.customerReferenceMasked,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      paidAt: payment.completedAt ?? payment.createdAt,
    });
  }

  return [...seen.values()].slice(0, limit);
}

/** Recent payments, newest first, whatever their outcome. */
export function recentPayments(payments: readonly BillPayment[] = [], limit = 5): BillPayment[] {
  return [...payments].sort(byNewest).slice(0, limit);
}

function byNewest(left: BillPayment, right: BillPayment): number {
  return Date.parse(right.createdAt) - Date.parse(left.createdAt);
}

export type CategoryTone = 'electricity' | 'water' | 'tv' | 'internet' | 'phone' | 'other';

/** Which of the design's colours a category is drawn in. */
export function categoryTone(name: string): CategoryTone {
  const lower = name.toLowerCase();
  if (lower.includes('electric') || lower.includes('power')) return 'electricity';
  if (lower.includes('water')) return 'water';
  if (lower.includes('tv') || lower.includes('cable')) return 'tv';
  if (lower.includes('internet') || lower.includes('broadband')) return 'internet';
  if (lower.includes('airtime') || lower.includes('data') || lower.includes('phone')) {
    return 'phone';
  }
  return 'other';
}

/** The icon a category is drawn with, matching its tone. */
export function categoryIcon(name: string): React.ComponentProps<typeof Ionicons>['name'] {
  const lower = name.toLowerCase();
  if (lower.includes('electric') || lower.includes('power')) return 'flash-outline';
  if (lower.includes('water')) return 'water-outline';
  if (lower.includes('tv') || lower.includes('cable')) return 'tv-outline';
  if (lower.includes('internet') || lower.includes('broadband')) return 'wifi-outline';
  if (lower.includes('data')) return 'wifi-outline';
  if (lower.includes('airtime') || lower.includes('phone')) return 'phone-portrait-outline';
  if (lower.includes('school') || lower.includes('fees')) return 'book-outline';
  if (lower.includes('insur')) return 'shield-outline';
  return 'receipt-outline';
}
