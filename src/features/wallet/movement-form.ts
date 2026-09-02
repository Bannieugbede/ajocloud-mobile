import { formatMinorAmount, majorToMinor } from '@/utils/money';

/** Rough shape check only. The backend is the authority on who exists. */
export function isPlausibleEmail(value: string): boolean {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) && trimmed.length <= 320;
}

/**
 * Why an amount cannot be sent or withdrawn, or null when it can.
 *
 * The balance check is a courtesy: the backend re-checks it against the ledger
 * inside the settling transaction, which is the only place it can be authoritative.
 */
export function movementAmountError(
  amountMinor: string | null,
  availableMinor: string | null,
  currency = 'NGN',
): string | null {
  if (amountMinor === null) return 'Enter an amount, for example 5000.';
  if (availableMinor === null) return null;
  if (BigInt(amountMinor) > BigInt(availableMinor)) {
    return `You have ${formatMinorAmount(availableMinor, currency)} available.`;
  }
  return null;
}

/** Whether a send is ready to submit. */
export function canSend(input: {
  recipientEmail: string;
  amountMajor: string;
  availableMinor: string | null;
}): boolean {
  const amountMinor = majorToMinor(input.amountMajor);
  return (
    isPlausibleEmail(input.recipientEmail) &&
    amountMinor !== null &&
    movementAmountError(amountMinor, input.availableMinor) === null
  );
}

/**
 * What a withdrawal's status means to the person who asked for it.
 *
 * PENDING is the normal outcome, not a problem: the payout is released by an
 * operator, so a screen must not present it as money already in their bank.
 */
export function withdrawalOutcome(status: string): 'requested' | 'sent' | 'failed' {
  switch (status) {
    case 'SUCCEEDED':
      return 'sent';
    case 'FAILED':
    case 'REVERSED':
    case 'CANCELLED':
      return 'failed';
    default:
      // PENDING, REVIEWING, PROCESSING.
      return 'requested';
  }
}
