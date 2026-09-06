import { majorToMinor } from '@/utils/money';

/**
 * Choosing how much to bring into the wallet.
 *
 * The one payment in the app where the client names the amount, because a
 * top-up has no row to read one from. Everything the screen enforces is
 * enforced again by the server; this exists so the member is told before they
 * commit rather than after.
 */

/**
 * The smallest deposit the backend accepts, in minor units.
 *
 * Mirrors MINIMUM_DEPOSIT_MINOR in the payments service. Duplicated rather than
 * fetched because it gates a button, and a screen that had to ask the server
 * what it may offer could not draw itself offline.
 */
export const MINIMUM_TOPUP_MINOR = 50_000n;

/** The amounts offered as one tap, in minor units. */
export const QUICK_AMOUNTS_MINOR = [
  '500000',
  '1000000',
  '2000000',
  '5000000',
  '10000000',
  '20000000',
] as const;

export type TopupProblem = 'empty' | 'invalid' | 'too-small';

/**
 * What is wrong with the amount, or null when nothing is.
 *
 * Distinguishes empty from invalid so the screen can stay quiet until someone
 * has actually typed something, rather than showing an error on a field they
 * have not reached.
 */
export function topupProblem(amountMajor: string): TopupProblem | null {
  if (amountMajor.trim() === '') return 'empty';
  const minor = majorToMinor(amountMajor);
  if (minor === null) return 'invalid';
  if (BigInt(minor) < MINIMUM_TOPUP_MINOR) return 'too-small';
  return null;
}

export function topupProblemMessage(problem: TopupProblem, formatted: string): string | null {
  switch (problem) {
    case 'empty':
      // Not an error: the field is simply not filled in yet.
      return null;
    case 'invalid':
      return 'Enter an amount, for example 10000.';
    case 'too-small':
      return `The smallest amount you can add is ${formatted}.`;
  }
}

/** The amount to send, or null while it is not yet payable. */
export function topupAmountMinor(amountMajor: string): string | null {
  return topupProblem(amountMajor) === null ? majorToMinor(amountMajor) : null;
}
