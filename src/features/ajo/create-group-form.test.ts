import {
  CREATE_GROUP_STEPS,
  MAX_MEMBERS,
  MIN_MEMBERS,
  coverageWarning,
  coversEveryPosition,
  deriveEndDate,
  durationLabel,
  durationUnit,
  hasErrors,
  initialCreateGroupValues,
  payoutPerPositionMinor,
  stepMembers,
  toCreateRequest,
  validateStep,
  type CreateGroupValues,
} from './create-group-form';

const valid: CreateGroupValues = {
  ...initialCreateGroupValues,
  name: 'Eko Savings Circle',
  maxSlots: '12',
  amountMajor: '25000',
};

describe('validating a step', () => {
  it('requires a name of at least three characters', () => {
    expect(validateStep('basics', { ...valid, name: 'Ek' }).name).toBeDefined();
    expect(validateStep('basics', valid).name).toBeUndefined();
  });

  it('holds the rotation within the sizes the backend accepts', () => {
    expect(validateStep('members', { ...valid, maxSlots: '1' }).maxSlots).toBeDefined();
    expect(validateStep('members', { ...valid, maxSlots: '1001' }).maxSlots).toBeDefined();
    expect(validateStep('members', { ...valid, maxSlots: '2' }).maxSlots).toBeUndefined();
  });

  it('refuses more positions than the group has', () => {
    const values = { ...valid, multipleSlots: true, maxSlots: '4', requestedSlots: '5' };
    expect(validateStep('members', values).requestedSlots).toBeDefined();
  });

  it('refuses a second position while multiple slots are off', () => {
    // The toggle is the whole reason the field is offered, so taking two with
    // it off would send a request the backend rejects for a reason the admin
    // cannot see.
    const values = { ...valid, multipleSlots: false, requestedSlots: '2' };
    expect(validateStep('members', values).requestedSlots).toBeDefined();
  });

  it('requires an amount before the terms can be reviewed', () => {
    expect(validateStep('amounts', { ...valid, amountMajor: '' }).amountMajor).toBeDefined();
    expect(validateStep('amounts', valid).amountMajor).toBeUndefined();
  });

  it('asks nothing on the review step, which only restates', () => {
    expect(hasErrors(validateStep('review', valid))).toBe(false);
  });
});

describe('the member stepper', () => {
  it('nudges up and down', () => {
    expect(stepMembers('20', 1)).toBe('21');
    expect(stepMembers('20', -1)).toBe('19');
  });

  it('cannot be pushed below a rotation that works or above the backend limit', () => {
    expect(stepMembers(String(MIN_MEMBERS), -1)).toBe(String(MIN_MEMBERS));
    expect(stepMembers(String(MAX_MEMBERS), 1)).toBe(String(MAX_MEMBERS));
  });

  it('recovers from a value that is not a number', () => {
    expect(stepMembers('', 1)).toBe(String(MIN_MEMBERS + 1));
  });
});

describe('rotation coverage', () => {
  it('accepts a rotation long enough to pay everyone once', () => {
    expect(coversEveryPosition(12, 12)).toBe(true);
    expect(coversEveryPosition(20, 12)).toBe(true);
  });

  it('rejects one that would strand the members at the back', () => {
    // Twenty positions on a twelve-month monthly rotation pays twelve people
    // and leaves eight contributing towards a turn that never arrives.
    expect(coversEveryPosition(12, 20)).toBe(false);
  });

  it('names both numbers and both ways out', () => {
    const warning = coverageWarning({ ...valid, duration: 12, maxSlots: '20' });
    expect(warning).toContain('20');
    expect(warning).toContain('12');
  });

  it('says nothing when the rotation fits', () => {
    expect(coverageWarning({ ...valid, duration: 12, maxSlots: '12' })).toBeNull();
  });
});

describe('naming the duration', () => {
  it('uses the unit the frequency implies', () => {
    expect(durationLabel(12, 'MONTHLY')).toBe('12 months');
    expect(durationLabel(1, 'MONTHLY')).toBe('1 month');
    expect(durationLabel(6, 'WEEKLY')).toBe('6 weeks');
    expect(durationUnit('DAILY').short).toBe('d');
  });
});

describe('the derived end date', () => {
  it('advances by calendar months so the day of month is kept', () => {
    const start = new Date('2026-01-15T00:00:00.000Z');
    expect(deriveEndDate(start, 'MONTHLY', 12).toISOString()).toBe('2027-01-15T00:00:00.000Z');
  });

  it('advances by days for the shorter frequencies', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    expect(deriveEndDate(start, 'WEEKLY', 4).toISOString().slice(0, 10)).toBe('2026-01-29');
  });
});

describe('what a position receives', () => {
  it('is one contribution from every position', () => {
    expect(payoutPerPositionMinor('2500000', 12)).toBe('30000000');
  });
});

describe('building the request', () => {
  const now = new Date('2026-03-10T14:30:00.000Z');

  it('starts today at midnight rather than at the moment of tapping', () => {
    // A start time of 14:30 would put every later cycle at 14:30 too, which is
    // not what "starts today" means to anyone.
    const request = toCreateRequest(valid, now);
    expect(request?.startDate).toBe('2026-03-10T00:00:00.000Z');
  });

  it('derives the end date from the duration', () => {
    const request = toCreateRequest({ ...valid, duration: 12 }, now);
    expect(request?.endDate).toBe('2027-03-10T00:00:00.000Z');
  });

  it('sends the grace period in the minutes the backend stores', () => {
    const request = toCreateRequest({ ...valid, graceDays: 3 }, now);
    expect(request?.gracePeriodMinutes).toBe(3 * 24 * 60);
  });

  it('caps a member at one position unless multiple slots are on', () => {
    expect(toCreateRequest({ ...valid, multipleSlots: false }, now)?.maxSlotsPerMember).toBe(1);
  });

  it('omits the cap entirely when a member may hold several', () => {
    // Omitted rather than set to the slot count: the backend then allows up to
    // the group's own capacity, which a fixed number here could not express.
    const request = toCreateRequest({ ...valid, multipleSlots: true }, now);
    expect(request).not.toHaveProperty('maxSlotsPerMember');
  });

  it('prices the unit for a variable group', () => {
    const request = toCreateRequest({ ...valid, mode: 'FLEXIBLE_UNIT' }, now);
    expect(request?.contributionMode).toBe('FLEXIBLE_UNIT');
    expect(request?.contributionUnitMinor).toBe('2500000');
  });

  it('sends no unit price for a fixed group', () => {
    const request = toCreateRequest({ ...valid, mode: 'FIXED' }, now);
    expect(request).not.toHaveProperty('contributionUnitMinor');
  });

  it('refuses to build a partial body when any step is invalid', () => {
    // A partial body would create a group on terms the admin never saw.
    expect(toCreateRequest({ ...valid, name: '' }, now)).toBeNull();
    expect(toCreateRequest({ ...valid, amountMajor: '' }, now)).toBeNull();
    expect(toCreateRequest({ ...valid, maxSlots: '0' }, now)).toBeNull();
  });

  it('still builds when the rotation is too short, since that is a warning', () => {
    // Coverage is surfaced for the admin to decide on, not enforced: a group
    // may legitimately be created before all its members have joined.
    expect(toCreateRequest({ ...valid, duration: 1, maxSlots: '20' }, now)).not.toBeNull();
  });
});

describe('the steps', () => {
  it('ends on the review, so the terms are the last thing seen', () => {
    expect(CREATE_GROUP_STEPS[CREATE_GROUP_STEPS.length - 1]).toBe('review');
  });
});
