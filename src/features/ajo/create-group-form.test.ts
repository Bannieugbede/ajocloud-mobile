import {
  cycleCount,
  deriveEndDate,
  hasErrors,
  initialCreateGroupValues,
  parseDate,
  toCreateRequest,
  validateStep,
  type CreateGroupValues,
} from './create-group-form';

const valid: CreateGroupValues = {
  name: 'Family Rotation',
  amountMajor: '10000',
  frequency: 'MONTHLY',
  maxSlots: '6',
  requestedSlots: '2',
  startDate: '2026-10-01',
  maxSlotsPerMember: '',
};

describe('parseDate', () => {
  it('accepts a real date', () => {
    expect(parseDate('2026-10-01')?.toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });

  it('rejects a date that does not exist', () => {
    // Date would silently roll this into March, creating a schedule that starts
    // on a day the user never chose.
    expect(parseDate('2026-02-31')).toBeNull();
  });

  it.each(['', '01-10-2026', '2026-10', 'tomorrow'])('rejects %p', (value) => {
    expect(parseDate(value)).toBeNull();
  });
});

describe('deriveEndDate', () => {
  it('advances by calendar months so the day of month is kept', () => {
    // 30-day arithmetic would drift a rotation starting on the 15th.
    const end = deriveEndDate(new Date('2026-01-15T00:00:00.000Z'), 'MONTHLY', 6);
    expect(end.toISOString()).toBe('2026-07-15T00:00:00.000Z');
  });

  it('advances weekly rotations by whole weeks', () => {
    const end = deriveEndDate(new Date('2026-01-01T00:00:00.000Z'), 'WEEKLY', 4);
    expect(end.toISOString()).toBe('2026-01-29T00:00:00.000Z');
  });

  it('gives every position exactly one payout cycle', () => {
    expect(cycleCount(6)).toBe(6);
  });
});

describe('validateStep', () => {
  it('passes every step for a valid form', () => {
    for (const step of ['basics', 'slots', 'schedule', 'advanced'] as const) {
      expect(validateStep(step, valid)).toEqual({});
    }
  });

  it('requires a name of at least 3 characters', () => {
    expect(validateStep('basics', { ...valid, name: 'ab' }).name).toBeDefined();
  });

  it('rejects an unpayable contribution', () => {
    expect(validateStep('basics', { ...valid, amountMajor: '0' }).amountMajor).toBeDefined();
  });

  it('requires at least two positions, since one member is not a rotation', () => {
    expect(validateStep('slots', { ...valid, maxSlots: '1' }).maxSlots).toBeDefined();
  });

  it('refuses taking more positions than the group has', () => {
    expect(
      validateStep('slots', { ...valid, maxSlots: '4', requestedSlots: '5' }).requestedSlots,
    ).toBeDefined();
  });

  it('leaves the per-member cap optional', () => {
    expect(validateStep('advanced', { ...valid, maxSlotsPerMember: '' })).toEqual({});
  });

  it('refuses a per-member cap above the group capacity', () => {
    // This is the rule that returned an opaque 500 before the backend fix; the
    // form explains it where the user can act on it.
    expect(
      validateStep('advanced', { ...valid, maxSlotsPerMember: '100' }).maxSlotsPerMember,
    ).toBeDefined();
  });

  it('refuses a per-member cap below what the creator is taking', () => {
    expect(
      validateStep('advanced', { ...valid, requestedSlots: '3', maxSlotsPerMember: '2' })
        .maxSlotsPerMember,
    ).toBeDefined();
  });

  it('reports only the current step’s problems', () => {
    // The name is invalid, but a user on the slots step must not be shown it.
    const errors = validateStep('slots', { ...initialCreateGroupValues, maxSlots: '6' });
    expect(errors.name).toBeUndefined();
  });
});

describe('toCreateRequest', () => {
  it('converts naira to minor units and derives the end date', () => {
    const request = toCreateRequest(valid);
    expect(request).toMatchObject({
      name: 'Family Rotation',
      baseContributionMinor: '1000000',
      maxSlots: 6,
      requestedSlots: 2,
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2027-04-01T00:00:00.000Z',
    });
  });

  it('omits the per-member cap when blank, rather than sending a guess', () => {
    // Sending a number here would cap the group at it; omitting lets the
    // backend allow up to the group's own capacity.
    expect(toCreateRequest(valid)).not.toHaveProperty('maxSlotsPerMember');
  });

  it('includes the cap when given', () => {
    expect(toCreateRequest({ ...valid, maxSlotsPerMember: '3' })).toMatchObject({
      maxSlotsPerMember: 3,
    });
  });

  it('returns null for an incomplete form rather than a partial body', () => {
    expect(toCreateRequest(initialCreateGroupValues)).toBeNull();
  });

  it('returns null when a later step is invalid, even if earlier ones pass', () => {
    expect(toCreateRequest({ ...valid, maxSlotsPerMember: '999' })).toBeNull();
  });
});

describe('hasErrors', () => {
  it('is false for a clean step', () => {
    expect(hasErrors({})).toBe(false);
  });

  it('is true when any field failed', () => {
    expect(hasErrors({ name: 'bad' })).toBe(true);
  });
});
