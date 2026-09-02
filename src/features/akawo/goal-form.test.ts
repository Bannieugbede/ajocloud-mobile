import {
  hasGoalErrors,
  initialGoalValues,
  needsDate,
  needsTarget,
  parseGoalDate,
  toGoalRequest,
  validateGoal,
  type GoalValues,
} from './goal-form';

const NOW = new Date('2026-09-02T00:00:00.000Z');

const valid: GoalValues = {
  name: 'School fees',
  type: 'TARGET',
  targetMajor: '50000',
  targetDate: '2027-01-01',
};

describe('needsTarget', () => {
  it.each(['TARGET', 'LOCKED'] as const)('requires a target for a %s goal', (type) => {
    expect(needsTarget(type)).toBe(true);
  });

  it('does not ask a flexible goal for a target it has no meaning for', () => {
    expect(needsTarget('FLEXIBLE')).toBe(false);
  });
});

describe('needsDate', () => {
  it('requires a date for a locked goal, which is what it unlocks on', () => {
    expect(needsDate('LOCKED')).toBe(true);
  });

  it.each(['TARGET', 'FLEXIBLE'] as const)('leaves the date optional for %s', (type) => {
    expect(needsDate(type)).toBe(false);
  });
});

describe('parseGoalDate', () => {
  it('accepts a real date', () => {
    expect(parseGoalDate('2027-01-01')?.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('rejects a date that does not exist', () => {
    expect(parseGoalDate('2027-02-31')).toBeNull();
  });

  it.each(['', '01-01-2027', 'soon'])('rejects %p', (value) => {
    expect(parseGoalDate(value)).toBeNull();
  });
});

describe('validateGoal', () => {
  it('accepts a complete target goal', () => {
    expect(validateGoal(valid, NOW)).toEqual({});
  });

  it('requires a name of at least 3 characters', () => {
    expect(validateGoal({ ...valid, name: 'ab' }, NOW).name).toBeDefined();
  });

  it('requires a target amount for a target goal', () => {
    expect(validateGoal({ ...valid, targetMajor: '' }, NOW).targetMajor).toBeDefined();
  });

  it('refuses a zero target, which is not something to save towards', () => {
    expect(validateGoal({ ...valid, targetMajor: '0' }, NOW).targetMajor).toBeDefined();
  });

  it('does not ask a flexible goal for a target', () => {
    const errors = validateGoal({ ...valid, type: 'FLEXIBLE', targetMajor: '' }, NOW);
    expect(errors.targetMajor).toBeUndefined();
  });

  it('requires a date for a locked goal', () => {
    const errors = validateGoal({ ...valid, type: 'LOCKED', targetDate: '' }, NOW);
    expect(errors.targetDate).toBeDefined();
  });

  it('refuses a date in the past, which would unlock immediately', () => {
    expect(validateGoal({ ...valid, targetDate: '2020-01-01' }, NOW).targetDate).toBeDefined();
  });

  it('refuses today, since a goal maturing now is already matured', () => {
    expect(validateGoal({ ...valid, targetDate: '2026-09-02' }, NOW).targetDate).toBeDefined();
  });

  it('validates an optional date when one is given anyway', () => {
    const errors = validateGoal({ ...valid, type: 'FLEXIBLE', targetDate: 'nonsense' }, NOW);
    expect(errors.targetDate).toBeDefined();
  });
});

describe('toGoalRequest', () => {
  it('converts naira to minor units and the date to an instant', () => {
    expect(toGoalRequest(valid, NOW)).toEqual({
      name: 'School fees',
      type: 'TARGET',
      targetMinor: '5000000',
      targetDate: '2027-01-01T00:00:00.000Z',
    });
  });

  it('omits the target for a flexible goal rather than sending a blank', () => {
    // The backend expects digits where present; an empty string is a 400.
    const request = toGoalRequest(
      { ...valid, type: 'FLEXIBLE', targetMajor: '', targetDate: '' },
      NOW,
    );
    expect(request).not.toHaveProperty('targetMinor');
    expect(request).not.toHaveProperty('targetDate');
  });

  it('returns null for an incomplete form rather than a partial body', () => {
    expect(toGoalRequest(initialGoalValues, NOW)).toBeNull();
  });
});

describe('hasGoalErrors', () => {
  it('is false for a clean form', () => {
    expect(hasGoalErrors({})).toBe(false);
  });

  it('is true when any field failed', () => {
    expect(hasGoalErrors({ name: 'bad' })).toBe(true);
  });
});
