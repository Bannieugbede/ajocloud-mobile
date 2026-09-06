import type { CreateAjoGroupInput } from '@/api/endpoints/ajo-groups';
import { majorToMinor } from '@/utils/money';

export type Frequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
export type ContributionMode = 'FIXED' | 'FLEXIBLE_UNIT';

export type CreateGroupValues = {
  name: string;
  mode: ContributionMode;
  frequency: Frequency;
  /** How many periods the rotation runs for, as a count of `frequency`. */
  duration: number;
  maxSlots: string;
  requestedSlots: string;
  /** Whether one member may hold more than one position. */
  multipleSlots: boolean;
  amountMajor: string;
  /** Days a late contribution is tolerated before it counts as late. */
  graceDays: number;
};

/**
 * Twenty positions and a monthly rotation is a group nobody alive will see the
 * end of, so the durations offered stop at a year. The cap is stated on the
 * screen rather than silently enforced.
 */
export const MAX_DURATION = 12;

export const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 10, 12] as const;
export const GRACE_DAY_OPTIONS = [1, 2, 3, 5, 7] as const;

/** The default group: monthly, a year long, twenty positions. */
export const initialCreateGroupValues: CreateGroupValues = {
  name: '',
  mode: 'FIXED',
  frequency: 'MONTHLY',
  duration: 12,
  maxSlots: '20',
  requestedSlots: '1',
  multipleSlots: false,
  amountMajor: '',
  graceDays: 3,
};

/** The steps, in order. */
export const CREATE_GROUP_STEPS = ['basics', 'members', 'amounts', 'review'] as const;
export type CreateGroupStep = (typeof CREATE_GROUP_STEPS)[number];

export const STEP_LABELS: Record<CreateGroupStep, string> = {
  basics: 'BASICS',
  members: 'MEMBERS',
  amounts: 'AMOUNTS',
  review: 'REVIEW',
};

export const MIN_MEMBERS = 2;
export const MAX_MEMBERS = 1_000;

function positiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export function parseMembers(value: string): number | null {
  return positiveInt(value);
}

/** Nudges the member count, clamped so the stepper cannot leave a valid range. */
export function stepMembers(current: string, delta: number): string {
  const parsed = positiveInt(current) ?? MIN_MEMBERS;
  return String(Math.min(MAX_MEMBERS, Math.max(MIN_MEMBERS, parsed + delta)));
}

const FREQUENCY_DAYS: Record<Frequency, number> = {
  DAILY: 1,
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
};

/** What one period of this frequency is called, for the duration chips. */
export function durationUnit(frequency: Frequency): { one: string; many: string; short: string } {
  switch (frequency) {
    case 'DAILY':
      return { one: 'day', many: 'days', short: 'd' };
    case 'WEEKLY':
      return { one: 'week', many: 'weeks', short: 'wk' };
    case 'BIWEEKLY':
      return { one: 'fortnight', many: 'fortnights', short: 'fn' };
    default:
      return { one: 'month', many: 'months', short: 'mo' };
  }
}

export function durationLabel(duration: number, frequency: Frequency): string {
  const unit = durationUnit(frequency);
  return `${String(duration)} ${duration === 1 ? unit.one : unit.many}`;
}

/**
 * The end date implied by the start, frequency and duration.
 *
 * Derived rather than asked for: the backend requires an endDate, and a date
 * that disagreed with the rotation length would produce a group whose schedule
 * does not fit. MONTHLY advances by calendar months, so a rotation starting on
 * the 15th keeps landing on the 15th.
 */
export function deriveEndDate(start: Date, frequency: Frequency, duration: number): Date {
  const end = new Date(start.getTime());
  if (frequency === 'MONTHLY') {
    end.setUTCMonth(end.getUTCMonth() + duration);
    return end;
  }
  end.setUTCDate(end.getUTCDate() + FREQUENCY_DAYS[frequency] * duration);
  return end;
}

/**
 * Whether the rotation is long enough to pay every position once.
 *
 * Each position is paid out in its own cycle, so a group needs at least as many
 * cycles as it has positions. Twenty members on a twelve-month monthly rotation
 * cannot all be paid, and a group created that way would strand eight people
 * who paid in and never received a payout — which is why this is surfaced
 * rather than silently corrected.
 */
export function coversEveryPosition(duration: number, maxSlots: number): boolean {
  return duration >= maxSlots;
}

export function coverageWarning(values: CreateGroupValues): string | null {
  const slots = positiveInt(values.maxSlots);
  if (slots === null) return null;
  if (coversEveryPosition(values.duration, slots)) return null;
  const unit = durationUnit(values.frequency);
  return (
    `${String(slots)} positions need ${String(slots)} ${unit.many}, but this group runs for ` +
    `${durationLabel(values.duration, values.frequency)}. ` +
    `Shorten it to ${String(values.duration)} positions, or run it for ${String(slots)} ${unit.many}.`
  );
}

/** What each position receives when its turn comes: one contribution per slot. */
export function payoutPerPositionMinor(amountMinor: string, maxSlots: number): string {
  return (BigInt(amountMinor) * BigInt(maxSlots)).toString();
}

export type FieldErrors = Partial<Record<keyof CreateGroupValues, string>>;

/**
 * Validates one step's fields.
 *
 * Per-step rather than whole-form, so nobody is shown an error for a field they
 * have not reached and "can I continue" is a question about this step alone.
 */
export function validateStep(step: CreateGroupStep, values: CreateGroupValues): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 'basics') {
    if (values.name.trim().length < 3) {
      errors.name = 'Give the group a name of at least 3 characters.';
    }
    if (!DURATION_OPTIONS.includes(values.duration as (typeof DURATION_OPTIONS)[number])) {
      errors.duration = 'Choose how long the group runs for.';
    }
  }

  if (step === 'members') {
    const maxSlots = parseMembers(values.maxSlots);
    if (maxSlots === null || maxSlots < MIN_MEMBERS || maxSlots > MAX_MEMBERS) {
      errors.maxSlots = `A rotation needs between ${String(MIN_MEMBERS)} and ${String(MAX_MEMBERS)} positions.`;
    }
    const requested = positiveInt(values.requestedSlots);
    if (requested === null) {
      errors.requestedSlots = 'Choose how many positions you are taking.';
    } else if (maxSlots !== null && requested > maxSlots) {
      errors.requestedSlots = 'You cannot take more positions than the group has.';
    } else if (!values.multipleSlots && requested > 1) {
      errors.requestedSlots = 'Turn on multiple slots to take more than one position.';
    }
  }

  if (step === 'amounts') {
    if (majorToMinor(values.amountMajor) === null) {
      errors.amountMajor = 'Enter how much each position contributes, e.g. 25000.';
    }
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Builds the request once every step validates.
 *
 * Returns null rather than a partial body if anything is invalid, so an
 * incomplete form cannot reach the API.
 */
export function toCreateRequest(
  values: CreateGroupValues,
  now: Date = new Date(),
): CreateAjoGroupInput | null {
  for (const step of CREATE_GROUP_STEPS) {
    if (hasErrors(validateStep(step, values))) return null;
  }
  const amountMinor = majorToMinor(values.amountMajor);
  const maxSlots = parseMembers(values.maxSlots);
  const requestedSlots = positiveInt(values.requestedSlots);
  if (amountMinor === null || maxSlots === null || requestedSlots === null) return null;

  // Starts today: the design asks for a duration rather than a date, and the
  // rotation length is what the admin is actually choosing.
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );

  return {
    name: values.name.trim(),
    contributionMode: values.mode,
    contributionFrequency: values.frequency,
    baseContributionMinor: amountMinor,
    // A flexible group prices one unit; the base amount is that unit.
    ...(values.mode === 'FLEXIBLE_UNIT' ? { contributionUnitMinor: amountMinor } : {}),
    maxSlots,
    requestedSlots,
    // Omitted when one member may hold many, so the backend allows up to the
    // group's own capacity rather than a number this screen would have to guess.
    ...(values.multipleSlots ? {} : { maxSlotsPerMember: 1 }),
    startDate: start.toISOString(),
    endDate: deriveEndDate(start, values.frequency, values.duration).toISOString(),
    gracePeriodMinutes: values.graceDays * 24 * 60,
  };
}
