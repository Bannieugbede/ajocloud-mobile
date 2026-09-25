import { MINIMUM_TOPUP_MINOR } from '@/features/wallet/fund-wallet';
import { majorToMinor } from '@/utils/money';

/**
 * The rules the payment screens apply before anything is sent. The server
 * enforces every one of them again; these exist so a member is told before
 * they commit rather than after.
 */

/**
 * How far the wallet is from covering `totalMinor`, or null when it covers it
 * or the balance is not yet known.
 */
export function walletShortfallMinor(
  availableMinor: string | undefined,
  totalMinor: string,
): string | null {
  if (availableMinor === undefined) return null;
  const short = BigInt(totalMinor) - BigInt(availableMinor);
  return short > 0n ? short.toString() : null;
}

/**
 * How much to offer to add for a shortfall. Never less than the smallest
 * top-up the server accepts, so a member ₦50 short is not sent to a top-up that
 * would be refused.
 */
export function topUpForShortfallMinor(shortfallMinor: string): string {
  const short = BigInt(shortfallMinor);
  return (short > MINIMUM_TOPUP_MINOR ? short : MINIMUM_TOPUP_MINOR).toString();
}

export type PartAmountProblem = 'empty' | 'invalid' | 'zero' | 'too-much';

/** What is wrong with a part payment typed in major units, or null. */
export function partAmountProblem(
  amountMajor: string,
  owedMinor: string,
): PartAmountProblem | null {
  const typed = amountMajor.trim();
  if (typed === '') return 'empty';
  // Checked before parsing, which reads zero as no amount at all.
  if (/^0+(\.0{1,2})?$/.test(typed)) return 'zero';
  const minor = majorToMinor(typed);
  if (minor === null) return 'invalid';
  if (BigInt(minor) > BigInt(owedMinor)) return 'too-much';
  return null;
}

export function partAmountMessage(
  problem: PartAmountProblem,
  owedFormatted: string,
): string | null {
  switch (problem) {
    case 'empty':
      // Not an error yet: the field has simply not been filled in.
      return null;
    case 'invalid':
      return 'Enter an amount, for example 5000.';
    case 'zero':
      return 'Enter an amount greater than zero.';
    case 'too-much':
      return `That is more than the ${owedFormatted} still owed.`;
  }
}

/**
 * An idempotency key for one amount within one payment flow.
 *
 * A retried tap for the same amount must return the same intent rather than a
 * second one, while changing the amount must produce a new intent: the server
 * answers a repeated key with the original, whatever the new request says.
 */
export function intentKey(flowId: string, amountMinor: string | null): string {
  return `payment-${flowId}-${amountMinor ?? 'owed'}`;
}
