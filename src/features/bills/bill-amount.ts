import type { BillProduct } from '@/api/endpoints/bill-payments';
import { formatMinorAmount, majorToMinor } from '@/utils/money';

/**
 * Whether a product's amount is decided by the biller rather than the payer.
 *
 * A fixed product must be paid at exactly that amount — it is not a default the
 * user may edit, so the screen shows it rather than asking.
 */
export function isFixedAmount(product: BillProduct | null): boolean {
  return product?.fixedAmountMinor != null;
}

/**
 * Why an amount is not payable for this product, or null when it is.
 *
 * Mirrors `assertAmount` on the backend so the rule is explained where the user
 * can act on it. The backend still enforces it: this is a courtesy, not the
 * boundary.
 */
export function amountError(
  product: BillProduct | null,
  amountMinor: string | null,
): string | null {
  if (amountMinor === null) return 'Enter an amount, for example 1000.';
  const amount = BigInt(amountMinor);

  const fixed = product?.fixedAmountMinor;
  if (fixed != null && amount !== BigInt(fixed)) {
    return `This must be paid at exactly ${formatMinorAmount(fixed, product?.currency)}.`;
  }

  const minimum = product?.minimumMinor;
  if (minimum != null && amount < BigInt(minimum)) {
    return `The least you can pay here is ${formatMinorAmount(minimum, product?.currency)}.`;
  }

  const maximum = product?.maximumMinor;
  if (maximum != null && amount > BigInt(maximum)) {
    return `The most you can pay here is ${formatMinorAmount(maximum, product?.currency)}.`;
  }

  return null;
}

/**
 * The amount that will be sent, in minor units.
 *
 * A fixed product ignores whatever is typed and uses the biller's amount, so a
 * stale field cannot submit a figure the backend would reject.
 */
export function resolveAmountMinor(
  product: BillProduct | null,
  amountMajor: string,
): string | null {
  if (product?.fixedAmountMinor != null) return product.fixedAmountMinor;
  return majorToMinor(amountMajor);
}

/** Whether the wallet can cover the amount. Fees are added by the backend. */
export function canAfford(availableMinor: string | null, amountMinor: string | null): boolean {
  if (availableMinor === null || amountMinor === null) return true;
  return BigInt(availableMinor) >= BigInt(amountMinor);
}

/**
 * A validation is usable until it expires.
 *
 * Compared against a caller-supplied `now` so the check is deterministic in
 * tests and cannot see time move between two checks in one render.
 */
export function isValidationCurrent(expiresAt: string, now: Date): boolean {
  const expiry = new Date(expiresAt).getTime();
  return Number.isFinite(expiry) && expiry > now.getTime();
}

/** What a reference is called, so the field is not a generic "reference". */
export function referenceLabel(categoryName: string | undefined): string {
  const name = (categoryName ?? '').toLowerCase();
  if (name.includes('airtime') || name.includes('data')) return 'Phone number';
  if (name.includes('electric') || name.includes('power')) return 'Meter number';
  if (name.includes('tv') || name.includes('cable')) return 'Smartcard number';
  if (name.includes('water')) return 'Account number';
  return 'Customer reference';
}

/** How a bill payment's status should be presented to the payer. */
export type BillOutcome = 'succeeded' | 'pending' | 'failed' | 'unresolved';

/**
 * Groups the backend's eleven statuses into what the payer needs to know.
 *
 * `RECONCILIATION_REQUIRED` is deliberately its own outcome rather than a
 * failure: the wallet was debited but the provider's result is unknown, so
 * telling someone it failed would be wrong, and telling them it succeeded
 * would be worse.
 */
export function billOutcome(status: string): BillOutcome {
  switch (status) {
    case 'SUCCESSFUL':
      return 'succeeded';
    case 'FAILED':
    case 'REVERSED':
    case 'REFUNDED':
      return 'failed';
    case 'RECONCILIATION_REQUIRED':
      return 'unresolved';
    default:
      // CREATED, VALIDATING, VALIDATED, PENDING, PROCESSING, REFUND_PENDING.
      return 'pending';
  }
}

/** Whether the client should keep polling this payment. */
export function shouldPollBill(status: string): boolean {
  return billOutcome(status) === 'pending';
}
