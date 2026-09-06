import { dueDateFrom, dueDatePreview, poolProblem, poolProblemMessage } from './create-pool-form';

describe('dueDateFrom', () => {
  it('lands on the end of the chosen day, not the hour the form was filled in', () => {
    // Created late at night, due "in 7 days": the member has all of the seventh
    // day to pay, rather than being cut off at 11pm because of when the
    // organiser happened to be at their phone.
    const now = new Date('2026-09-06T23:14:00.000Z');
    expect(dueDateFrom(7, now)).toBe('2026-09-13T23:59:59.999Z');
  });

  it('rolls across a month boundary', () => {
    expect(dueDateFrom(30, new Date('2026-09-06T09:00:00.000Z'))).toBe('2026-10-06T23:59:59.999Z');
  });

  it('has no date when the organiser chose no deadline', () => {
    // A collection that runs until it is closed is a real choice, not a missing
    // answer, so it sends no dueAt rather than an invented one.
    expect(dueDateFrom(0, new Date('2026-09-06T09:00:00.000Z'))).toBeNull();
    expect(dueDateFrom(-1, new Date('2026-09-06T09:00:00.000Z'))).toBeNull();
  });
});

describe('dueDatePreview', () => {
  it('reads the deadline back before the pool is created', () => {
    expect(dueDatePreview(7, new Date('2026-09-06T09:00:00.000Z'), 'en-NG')).toContain('13');
  });

  it('explains what no deadline means rather than showing nothing', () => {
    expect(dueDatePreview(0, new Date('2026-09-06T09:00:00.000Z'))).toBe(
      'Members can pay until you close the pool',
    );
  });
});

describe('poolProblem', () => {
  it('accepts a complete form', () => {
    expect(poolProblem({ name: 'Departmental Dues', amountMinor: '500000' })).toBeNull();
  });

  it('reports the name before the amount, so the message points at the first gap', () => {
    expect(poolProblem({ name: '', amountMinor: null })).toBe('name');
  });

  it('rejects a name too short to identify the pool', () => {
    expect(poolProblem({ name: '  ab  ', amountMinor: '500000' })).toBe('name');
  });

  it('rejects an unpayable amount', () => {
    expect(poolProblem({ name: 'Departmental Dues', amountMinor: null })).toBe('amount');
  });

  it('has a message for every problem it can report', () => {
    expect(poolProblemMessage('name')).toBeTruthy();
    expect(poolProblemMessage('amount')).toBeTruthy();
    expect(poolProblemMessage(null)).toBeNull();
  });
});
