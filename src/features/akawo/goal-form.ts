import type { AkawoGoalType, CreateAkawoGoalInput } from '@/api/endpoints/akawo';
import { majorToMinor } from '@/utils/money';

export type GoalValues = {
  name: string;
  type: AkawoGoalType;
  targetMajor: string;
  targetDate: string;
};

export const initialGoalValues: GoalValues = {
  name: '',
  type: 'TARGET',
  targetMajor: '',
  targetDate: '',
};

/**
 * Whether this kind of goal needs a target amount.
 *
 * A flexible goal is an open pot with no finish line, so asking for a target
 * would be asking for a number that means nothing.
 */
export function needsTarget(type: AkawoGoalType): boolean {
  return type !== 'FLEXIBLE';
}

/** A locked goal cannot be withdrawn from before its date, so it needs one. */
export function needsDate(type: AkawoGoalType): boolean {
  return type === 'LOCKED';
}

/** ISO date (YYYY-MM-DD), rejecting days that do not exist. */
export function parseGoalDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const date = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Rejects 2026-02-31, which Date would roll into March.
  return date.toISOString().slice(0, 10) === trimmed ? date : null;
}

export type GoalErrors = Partial<Record<keyof GoalValues, string>>;

export function validateGoal(values: GoalValues, now: Date): GoalErrors {
  const errors: GoalErrors = {};
  if (values.name.trim().length < 3) {
    errors.name = 'Give the goal a name of at least 3 characters.';
  }
  if (needsTarget(values.type) && majorToMinor(values.targetMajor) === null) {
    errors.targetMajor = 'Enter how much you are saving towards, e.g. 50000.';
  }
  if (values.targetDate.trim() !== '' || needsDate(values.type)) {
    const parsed = parseGoalDate(values.targetDate);
    if (parsed === null) {
      errors.targetDate = 'Enter a date as YYYY-MM-DD.';
    } else if (parsed.getTime() <= now.getTime()) {
      // A locked goal that has already matured would be withdrawable at once,
      // which defeats locking it.
      errors.targetDate = 'Choose a date in the future.';
    }
  }
  return errors;
}

export function hasGoalErrors(errors: GoalErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Builds the request, or null if anything is invalid. */
export function toGoalRequest(values: GoalValues, now: Date): CreateAkawoGoalInput | null {
  if (hasGoalErrors(validateGoal(values, now))) return null;
  const targetMinor = majorToMinor(values.targetMajor);
  const date = parseGoalDate(values.targetDate);
  return {
    name: values.name.trim(),
    type: values.type,
    // Omitted rather than sent empty: a flexible goal has no target, and the
    // backend rejects a blank string where it expects digits.
    ...(needsTarget(values.type) && targetMinor ? { targetMinor } : {}),
    ...(date ? { targetDate: date.toISOString() } : {}),
  };
}
