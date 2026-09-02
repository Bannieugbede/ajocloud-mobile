import { majorToMinor } from '@/utils/money';
import type { CreateAjoGroupInput } from '@/api/endpoints/ajo-groups';

export type Frequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export type CreateGroupValues = {
  name: string;
  amountMajor: string;
  frequency: Frequency;
  maxSlots: string;
  requestedSlots: string;
  startDate: string;
  /** Blank means "up to the group's own capacity", which the backend defaults. */
  maxSlotsPerMember: string;
};

export const initialCreateGroupValues: CreateGroupValues = {
  name: '',
  amountMajor: '',
  frequency: 'MONTHLY',
  maxSlots: '',
  requestedSlots: '1',
  startDate: '',
  maxSlotsPerMember: '',
};

/** The steps, in order. Advanced is last so it can be skipped. */
export const CREATE_GROUP_STEPS = ['basics', 'slots', 'schedule', 'advanced'] as const;
export type CreateGroupStep = (typeof CREATE_GROUP_STEPS)[number];

function positiveInt(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/** ISO date (YYYY-MM-DD) typed by the user, validated as a real calendar date. */
export function parseDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Rejects 2026-02-31, which Date would silently roll into March.
  return date.toISOString().slice(0, 10) === trimmed ? date : null;
}

/**
 * How many cycles a rotation runs.
 *
 * One per slot: every position is paid out exactly once, which is what makes it
 * a rotation rather than an open-ended savings pot.
 */
export function cycleCount(maxSlots: number): number {
  return maxSlots;
}

const FREQUENCY_DAYS: Record<Frequency, number> = {
  DAILY: 1,
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
};

/**
 * The end date implied by the start, frequency and slot count.
 *
 * Derived rather than asked for: the backend requires an endDate, but a user
 * choosing one that disagrees with the rotation length would produce a group
 * whose schedule does not fit. MONTHLY advances by calendar months so a
 * rotation starting on the 15th keeps landing on the 15th.
 */
export function deriveEndDate(start: Date, frequency: Frequency, slots: number): Date {
  const end = new Date(start.getTime());
  if (frequency === 'MONTHLY') {
    end.setUTCMonth(end.getUTCMonth() + slots);
    return end;
  }
  end.setUTCDate(end.getUTCDate() + FREQUENCY_DAYS[frequency] * slots);
  return end;
}

export type FieldErrors = Partial<Record<keyof CreateGroupValues, string>>;

/**
 * Validates one step's fields.
 *
 * Per-step rather than whole-form so a user is not shown errors for fields they
 * have not reached yet, and so "can I continue" is a question about this step.
 */
export function validateStep(step: CreateGroupStep, values: CreateGroupValues): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 'basics') {
    if (values.name.trim().length < 3) {
      errors.name = 'Give the group a name of at least 3 characters.';
    }
    if (majorToMinor(values.amountMajor) === null) {
      errors.amountMajor = 'Enter how much each position contributes, e.g. 10000.';
    }
  }

  if (step === 'slots') {
    const maxSlots = positiveInt(values.maxSlots);
    const requested = positiveInt(values.requestedSlots);
    if (maxSlots === null || maxSlots < 2 || maxSlots > 1000) {
      errors.maxSlots = 'A rotation needs between 2 and 1000 positions.';
    }
    if (requested === null) {
      errors.requestedSlots = 'Choose how many positions you are taking.';
    } else if (maxSlots !== null && requested > maxSlots) {
      errors.requestedSlots = 'You cannot take more positions than the group has.';
    }
  }

  if (step === 'schedule') {
    if (parseDate(values.startDate) === null) {
      errors.startDate = 'Enter a start date as YYYY-MM-DD.';
    }
  }

  if (step === 'advanced') {
    const maxSlots = positiveInt(values.maxSlots);
    const perMember = values.maxSlotsPerMember.trim();
    if (perMember !== '') {
      const parsed = positiveInt(perMember);
      if (parsed === null) {
        errors.maxSlotsPerMember = 'Enter a whole number, or leave blank for no limit.';
      } else if (maxSlots !== null && parsed > maxSlots) {
        // The backend enforces this too, but catching it here explains the rule
        // where the user can act on it rather than after submitting.
        errors.maxSlotsPerMember = 'This cannot be more than the number of positions.';
      } else if (parsed < (positiveInt(values.requestedSlots) ?? 1)) {
        errors.maxSlotsPerMember = 'This cannot be fewer than the positions you are taking.';
      }
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
export function toCreateRequest(values: CreateGroupValues): CreateAjoGroupInput | null {
  for (const step of CREATE_GROUP_STEPS) {
    if (hasErrors(validateStep(step, values))) return null;
  }
  const amountMinor = majorToMinor(values.amountMajor);
  const maxSlots = positiveInt(values.maxSlots);
  const requestedSlots = positiveInt(values.requestedSlots);
  const start = parseDate(values.startDate);
  if (amountMinor === null || maxSlots === null || requestedSlots === null || start === null) {
    return null;
  }
  const perMember = positiveInt(values.maxSlotsPerMember.trim());
  return {
    name: values.name.trim(),
    contributionFrequency: values.frequency,
    baseContributionMinor: amountMinor,
    maxSlots,
    requestedSlots,
    startDate: start.toISOString(),
    endDate: deriveEndDate(start, values.frequency, cycleCount(maxSlots)).toISOString(),
    // Omitted entirely when blank: the backend then allows up to the group's own
    // capacity, which a fixed number here could not express.
    ...(perMember === null ? {} : { maxSlotsPerMember: perMember }),
  };
}
