/**
 * What Ajo Cloud charges.
 *
 * Every figure here is a financial statement to a member, so this module is
 * the single place it is written down. A rate typed into a screen is a rate
 * nobody can find later, and two screens quoting different numbers is worse
 * than quoting none.
 *
 * The banded fee model is still undecided and `feeMinor` is `"0"` on every
 * payment the backend settles today (docs/BACKEND_REQUIREMENTS.md). Rather than
 * print a plausible-looking table that charges nobody anything, the screen says
 * what is actually true right now. When the model lands, the rates replace
 * `amount` here and the screen needs no change.
 */

export type FeeLine = {
  readonly product: string;
  readonly name: string;
  /** What is charged today. `null` means no charge is applied. */
  readonly amount: string | null;
  readonly detail: string;
};

export const FEE_LINES: readonly FeeLine[] = [
  {
    product: 'Ajo',
    name: 'Contributions and payouts',
    amount: null,
    detail: 'Contributing to a group and receiving your payout are both free.',
  },
  {
    product: 'Akawo',
    name: 'Savings goals and group pools',
    amount: null,
    detail: 'Paying into a goal or a pool is free, and so is withdrawing to your wallet.',
  },
  {
    product: 'Food Ajo',
    name: 'Package subscriptions',
    amount: null,
    detail: 'What you pay is the package price the coordinator set. Nothing is added on top.',
  },
  {
    product: 'Bills',
    name: 'Airtime, data, electricity and TV',
    amount: null,
    detail: 'You pay the biller amount. Any provider charge is shown before you confirm.',
  },
  {
    product: 'Wallet',
    name: 'Funding and withdrawals',
    amount: null,
    detail: 'Your bank may charge for a transfer into Ajo Cloud. We add nothing.',
  },
];

/**
 * Whether anything is charged at all. Drives the summary line, so it cannot
 * drift from the table beneath it.
 */
export function chargesAnything(lines: readonly FeeLine[] = FEE_LINES): boolean {
  return lines.some((line) => line.amount !== null);
}

/** What a line shows in its amount column. */
export function feeAmountLabel(line: FeeLine): string {
  return line.amount ?? 'Free';
}
