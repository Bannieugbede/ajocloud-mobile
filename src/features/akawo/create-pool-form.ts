/**
 * The rules behind the create-pool form.
 *
 * Kept out of the screen so the deadline arithmetic — the part that decides
 * when people are told their money is late — is testable without rendering.
 */

/** Deadline choices, as days from today. */
export const DUE_DAY_OPTIONS = [7, 14, 30, 60, 90] as const;

export type DueDays = (typeof DUE_DAY_OPTIONS)[number] | null;

export const DUE_OPTIONS: readonly { value: number; label: string }[] = [
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
  { value: 60, label: '2 months' },
  { value: 90, label: '3 months' },
  // 0 means no deadline: a collection can legitimately run until the organiser
  // closes it, and forcing a date would invent one nobody agreed to.
  { value: 0, label: 'No deadline' },
];

/**
 * The deadline as an instant the backend can store.
 *
 * Fixed to the end of the chosen day in UTC rather than the moment the form was
 * submitted: a pool created at 11pm and due "in 7 days" should close at the end
 * of that seventh day, not cut a member off at 11pm because of when the
 * organiser happened to be filling the form in.
 */
export function dueDateFrom(days: number, now: Date = new Date()): string | null {
  if (!Number.isFinite(days) || days <= 0) return null;

  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + Math.floor(days),
      23,
      59,
      59,
      999,
    ),
  );
  return end.toISOString();
}

/**
 * How the chosen deadline reads back to the organiser before they submit.
 *
 * Formatted in UTC, the frame the deadline was built in. Left to local time the
 * end-of-day instant tips into the next date for anyone east of Greenwich — an
 * organiser in Lagos picking "1 week" would be promised the 14th while the
 * backend stored the 13th.
 */
export function dueDatePreview(days: number, now: Date = new Date(), locale?: string): string {
  const iso = dueDateFrom(days, now);
  if (!iso) return 'Members can pay until you close the pool';
  return `Payment due by ${new Date(iso).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
  })}`;
}

export type PoolProblem = 'name' | 'amount' | null;

/**
 * The first thing wrong with the form, or null when it is ready.
 *
 * One problem at a time and in field order, so the message beneath the button
 * always points at the field the organiser should fix next rather than listing
 * everything at once.
 */
export function poolProblem(values: { name: string; amountMinor: string | null }): PoolProblem {
  if (values.name.trim().length < 3) return 'name';
  if (values.amountMinor === null) return 'amount';
  return null;
}

export function poolProblemMessage(problem: PoolProblem): string | null {
  switch (problem) {
    case 'name':
      return 'Give the pool a name of at least 3 characters.';
    case 'amount':
      return 'Enter an amount greater than zero.';
    default:
      return null;
  }
}
