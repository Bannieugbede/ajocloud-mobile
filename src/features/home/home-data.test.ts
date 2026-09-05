import type { AjoCycle, AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import type { AkawoGoal } from '@/api/endpoints/akawo';
import type { BillPayment } from '@/api/endpoints/bill-payments';

import {
  buildUpcoming,
  greetingFor,
  recentQuickPay,
  relativeDueLabel,
  totalAkawoSaved,
  urgencyFor,
} from './home-data';

const NOW = new Date('2026-07-16T09:41:00Z');

function goal(overrides: Partial<AkawoGoal> = {}): AkawoGoal {
  return {
    id: 'goal-1',
    name: 'Rent',
    type: 'TARGET',
    targetMinor: '100000000',
    savedMinor: '23450000',
    progressBps: 2345,
    currency: 'NGN',
    status: 'ACTIVE',
    targetDate: null,
    ...overrides,
  };
}

describe('totalAkawoSaved', () => {
  it('is zero when there are no goals', () => {
    expect(totalAkawoSaved(undefined)).toBe('0');
    expect(totalAkawoSaved([])).toBe('0');
  });

  it('sums the saved amounts of live goals', () => {
    expect(totalAkawoSaved([goal({ savedMinor: '100' }), goal({ savedMinor: '250' })])).toBe('350');
  });

  it('excludes goals that have been paid out', () => {
    // A closed goal's money has already left. Counting it would show a member
    // savings they no longer hold.
    expect(
      totalAkawoSaved([
        goal({ savedMinor: '100' }),
        goal({ savedMinor: '900', status: 'CLOSED' }),
        goal({ savedMinor: '900', status: 'CANCELLED' }),
      ]),
    ).toBe('100');
  });

  it('stays exact past the safe integer range', () => {
    expect(totalAkawoSaved([goal({ savedMinor: '9007199254740993' })])).toBe('9007199254740993');
  });
});

describe('urgencyFor', () => {
  it('marks a past date overdue', () => {
    expect(urgencyFor('2026-07-15T09:41:00Z', NOW)).toBe('OVERDUE');
  });

  it('marks the next three days due soon', () => {
    expect(urgencyFor('2026-07-16T10:00:00Z', NOW)).toBe('DUE_SOON');
    expect(urgencyFor('2026-07-19T09:00:00Z', NOW)).toBe('DUE_SOON');
  });

  it('marks anything further out as merely scheduled', () => {
    expect(urgencyFor('2026-07-20T09:00:00Z', NOW)).toBe('SCHEDULED');
  });

  it('does not crash on an unparseable date', () => {
    expect(urgencyFor('not a date', NOW)).toBe('SCHEDULED');
  });
});

function group(overrides: Partial<AjoGroupSummary> = {}): AjoGroupSummary {
  return {
    id: 'group-1',
    name: 'Eko Savings Circle',
    status: 'ACTIVE',
    contributionFrequency: 'MONTHLY',
    contributionMode: 'FIXED',
    baseContributionMinor: '2500000',
    currency: 'NGN',
    maxSlots: 12,
    maxMembers: 12,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    _count: { slots: 12, members: 12 },
    ...overrides,
  };
}

function cycle(overrides: Partial<AjoCycle> = {}): AjoCycle {
  return {
    sequence: 1,
    contributionDueAt: '2026-07-18T00:00:00Z',
    payoutDueAt: '2026-07-20T00:00:00Z',
    status: 'OPEN',
    contributionSchedules: [],
    payoutSchedules: [],
    ...overrides,
  };
}

describe('buildUpcoming', () => {
  const mySchedule = {
    id: 'sched-1',
    slotId: 'slot-mine',
    amountDueMinor: '2500000',
    amountPaidMinor: '0',
    currency: 'NGN',
    status: 'DUE',
  };

  it('lists the viewer’s own unpaid contribution', () => {
    const items = buildUpcoming(
      [
        {
          group: group(),
          cycles: [cycle({ contributionSchedules: [mySchedule] })],
          mySlotIds: ['slot-mine'],
        },
      ],
      NOW,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      kind: 'CONTRIBUTION',
      groupName: 'Eko Savings Circle',
      amountMinor: '2500000',
      scheduleId: 'sched-1',
      urgency: 'DUE_SOON',
    });
  });

  it('never shows another member’s obligation as the viewer’s own', () => {
    // An admin's schedule contains every member's rows. Trusting it wholesale
    // would tell an admin they personally owe the whole group.
    const items = buildUpcoming(
      [
        {
          group: group(),
          cycles: [
            cycle({
              contributionSchedules: [
                mySchedule,
                { ...mySchedule, id: 'sched-2', slotId: 'slot-theirs' },
              ],
            }),
          ],
          mySlotIds: ['slot-mine'],
        },
      ],
      NOW,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.scheduleId).toBe('sched-1');
  });

  it('omits a contribution that is already paid', () => {
    const items = buildUpcoming(
      [
        {
          group: group(),
          cycles: [cycle({ contributionSchedules: [{ ...mySchedule, status: 'PAID' }] })],
          mySlotIds: ['slot-mine'],
        },
      ],
      NOW,
    );
    expect(items).toEqual([]);
  });

  it('asks only for the remainder of a part-paid contribution', () => {
    const items = buildUpcoming(
      [
        {
          group: group(),
          cycles: [
            cycle({
              contributionSchedules: [{ ...mySchedule, amountPaidMinor: '1000000' }],
            }),
          ],
          mySlotIds: ['slot-mine'],
        },
      ],
      NOW,
    );
    expect(items[0]?.amountMinor).toBe('1500000');
  });

  it('never shows a negative remainder when overpaid', () => {
    const items = buildUpcoming(
      [
        {
          group: group(),
          cycles: [
            cycle({
              contributionSchedules: [{ ...mySchedule, amountPaidMinor: '9999999' }],
            }),
          ],
          mySlotIds: ['slot-mine'],
        },
      ],
      NOW,
    );
    expect(items[0]?.amountMinor).toBe('0');
  });

  it('includes an incoming payout, and never marks it urgent', () => {
    const items = buildUpcoming(
      [
        {
          group: group({ name: 'Abuja Tech Circle' }),
          cycles: [
            cycle({
              payoutDueAt: '2026-07-17T00:00:00Z',
              payoutSchedules: [{ ...mySchedule, id: 'payout-1', amountDueMinor: '100000000' }],
            }),
          ],
          mySlotIds: ['slot-mine'],
        },
      ],
      NOW,
    );
    // Money arriving is expected, not owed: it is never "due soon" or overdue.
    expect(items[0]).toMatchObject({ kind: 'PAYOUT', urgency: 'SCHEDULED' });
  });

  it('drops anything beyond the horizon', () => {
    const items = buildUpcoming(
      [
        {
          group: group(),
          cycles: [
            cycle({
              contributionDueAt: '2027-01-01T00:00:00Z',
              contributionSchedules: [mySchedule],
            }),
          ],
          mySlotIds: ['slot-mine'],
        },
      ],
      NOW,
    );
    expect(items).toEqual([]);
  });

  it('orders soonest first across groups', () => {
    const items = buildUpcoming(
      [
        {
          group: group({ id: 'g2', name: 'Later' }),
          cycles: [
            cycle({
              contributionDueAt: '2026-07-25T00:00:00Z',
              contributionSchedules: [{ ...mySchedule, id: 'later' }],
            }),
          ],
          mySlotIds: ['slot-mine'],
        },
        {
          group: group({ id: 'g1', name: 'Sooner' }),
          cycles: [
            cycle({
              contributionDueAt: '2026-07-17T00:00:00Z',
              contributionSchedules: [{ ...mySchedule, id: 'sooner' }],
            }),
          ],
          mySlotIds: ['slot-mine'],
        },
      ],
      NOW,
    );
    expect(items.map((item) => item.groupName)).toEqual(['Sooner', 'Later']);
  });
});

function payment(overrides: Partial<BillPayment> = {}): BillPayment {
  return {
    id: 'pay-1',
    internalReference: 'REF-1',
    providerReference: null,
    customerReferenceMasked: '****7841',
    verifiedCustomerName: 'C OKAFOR',
    amountMinor: '2450000',
    feeMinor: '0',
    totalDebitMinor: '2450000',
    currency: 'NGN',
    status: 'SUCCESSFUL',
    reconciliationState: 'NOT_REQUIRED',
    failureReason: null,
    createdAt: '2026-07-01T00:00:00Z',
    completedAt: '2026-07-01T00:05:00Z',
    biller: { id: 'b1', name: 'DSTV', category: { id: 'c1', name: 'Cable TV' } },
    ...overrides,
  };
}

describe('recentQuickPay', () => {
  it('is empty without history', () => {
    expect(recentQuickPay(undefined)).toEqual([]);
    expect(recentQuickPay([])).toEqual([]);
  });

  it('names the biller rather than the masked reference', () => {
    expect(recentQuickPay([payment()])[0]).toMatchObject({
      billerName: 'DSTV',
      categoryName: 'Cable TV',
      customerReferenceMasked: '****7841',
    });
  });

  it('offers only payments that actually succeeded', () => {
    // Re-offering a failed payment implies it worked.
    expect(
      recentQuickPay([
        payment({ id: 'a', status: 'FAILED' }),
        payment({ id: 'b', status: 'REVERSED', customerReferenceMasked: '****1111' }),
        payment({ id: 'c', status: 'PENDING', customerReferenceMasked: '****2222' }),
      ]),
    ).toEqual([]);
  });

  it('shows one row per reference, however often it was paid', () => {
    const items = recentQuickPay([
      payment({ id: 'jan', completedAt: '2026-01-01T00:00:00Z' }),
      payment({ id: 'jul', completedAt: '2026-07-01T00:00:00Z' }),
    ]);
    expect(items).toHaveLength(1);
    // The most recent payment of that reference, not the oldest.
    expect(items[0]?.paymentId).toBe('jul');
  });

  it('respects the limit', () => {
    const items = recentQuickPay(
      [
        payment({ id: '1', customerReferenceMasked: '****1' }),
        payment({ id: '2', customerReferenceMasked: '****2' }),
        payment({ id: '3', customerReferenceMasked: '****3' }),
      ],
      2,
    );
    expect(items).toHaveLength(2);
  });

  it('falls back when a payment predates the biller field', () => {
    const legacy = recentQuickPay([payment({ biller: undefined })])[0];
    expect(legacy?.billerName).toBe('C OKAFOR');
    expect(legacy?.categoryName).toBeNull();
  });
});

describe('greetingFor', () => {
  it.each([
    [new Date(2026, 6, 16, 5, 0), 'Good morning'],
    [new Date(2026, 6, 16, 11, 59), 'Good morning'],
    [new Date(2026, 6, 16, 12, 0), 'Good afternoon'],
    [new Date(2026, 6, 16, 17, 59), 'Good afternoon'],
    [new Date(2026, 6, 16, 18, 0), 'Good evening'],
    [new Date(2026, 6, 16, 23, 59), 'Good evening'],
  ])('%s reads as %s', (at, expected) => {
    expect(greetingFor(at)).toBe(expected);
  });
});

describe('relativeDueLabel', () => {
  // Built from local-time dates, because "tomorrow" is a calendar-day question
  // and the answer must not change with the device's offset.
  const today = new Date(2026, 6, 16, 9, 41);

  it('names today and its neighbours', () => {
    expect(relativeDueLabel(new Date(2026, 6, 16, 23, 0).toISOString(), today)).toBe('today');
    expect(relativeDueLabel(new Date(2026, 6, 17, 1, 0).toISOString(), today)).toBe('tomorrow');
    expect(relativeDueLabel(new Date(2026, 6, 15, 23, 0).toISOString(), today)).toBe('yesterday');
  });

  it('counts days either side', () => {
    expect(relativeDueLabel(new Date(2026, 6, 18, 9, 0).toISOString(), today)).toBe('in 2 days');
    expect(relativeDueLabel(new Date(2026, 6, 12, 9, 0).toISOString(), today)).toBe('4 days ago');
  });

  it('returns nothing for an unparseable date rather than throwing', () => {
    expect(relativeDueLabel('nonsense', today)).toBe('');
  });
});
