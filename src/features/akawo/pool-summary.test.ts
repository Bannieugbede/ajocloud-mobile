import type { JoinedPool } from '@/api/endpoints/akawo-pools';

import {
  collectionSummary,
  deadlineLabel,
  expectedTotalMinor,
  outstandingDues,
  poolIsLive,
  progressBps,
  totalOutstandingMinor,
} from './pool-summary';

function joined(overrides: {
  id: string;
  name: string;
  dueStatus?: 'PENDING' | 'PROCESSING' | 'PAID' | 'WAIVED' | null;
  amountMinor?: string;
  dueAt?: string | null;
}): JoinedPool {
  return {
    membershipId: `m-${overrides.id}`,
    pool: {
      id: overrides.id,
      name: overrides.name,
      purpose: null,
      amountMinor: overrides.amountMinor ?? '300000',
      currency: 'NGN',
      status: 'OPEN',
      referenceLabel: 'Matric number',
      dueAt: overrides.dueAt === undefined ? '2026-09-15T00:00:00Z' : overrides.dueAt,
      closedAt: null,
      createdAt: '2026-08-01T00:00:00Z',
    },
    due:
      overrides.dueStatus === null || overrides.dueStatus === undefined
        ? null
        : {
            id: `d-${overrides.id}`,
            amountMinor: overrides.amountMinor ?? '300000',
            status: overrides.dueStatus,
            paidAt: overrides.dueStatus === 'PAID' ? '2026-09-01T00:00:00Z' : null,
          },
  };
}

describe('outstandingDues', () => {
  it('is empty when nothing is owed', () => {
    expect(outstandingDues(undefined)).toEqual([]);
    expect(outstandingDues([])).toEqual([]);
  });

  it('lists a pending due', () => {
    const dues = outstandingDues([
      joined({ id: 'p1', name: 'Faculty Week', dueStatus: 'PENDING' }),
    ]);
    expect(dues).toHaveLength(1);
    expect(dues[0]).toMatchObject({
      poolId: 'p1',
      poolName: 'Faculty Week',
      amountMinor: '300000',
    });
  });

  it('treats a processing payment as still owed', () => {
    // The money has not arrived until it settles, and hiding the row would let
    // someone believe they were finished.
    expect(
      outstandingDues([joined({ id: 'p1', name: 'A', dueStatus: 'PROCESSING' })]),
    ).toHaveLength(1);
  });

  it('excludes dues that are settled', () => {
    expect(
      outstandingDues([
        joined({ id: 'p1', name: 'Paid', dueStatus: 'PAID' }),
        // Waived is settled too: the organiser excused it, so nothing is owed.
        joined({ id: 'p2', name: 'Waived', dueStatus: 'WAIVED' }),
        joined({ id: 'p3', name: 'No due', dueStatus: null }),
      ]),
    ).toEqual([]);
  });

  it('puts the soonest deadline first', () => {
    const dues = outstandingDues([
      joined({ id: 'later', name: 'Later', dueStatus: 'PENDING', dueAt: '2026-10-01T00:00:00Z' }),
      joined({ id: 'sooner', name: 'Sooner', dueStatus: 'PENDING', dueAt: '2026-09-01T00:00:00Z' }),
    ]);
    expect(dues.map((due) => due.poolId)).toEqual(['sooner', 'later']);
  });

  it('sorts a pool with no deadline last rather than first', () => {
    // An absent date must not sort above a real one: nothing about "no
    // deadline" makes it the most urgent thing on the screen.
    const dues = outstandingDues([
      joined({ id: 'none', name: 'No deadline', dueStatus: 'PENDING', dueAt: null }),
      joined({ id: 'dated', name: 'Dated', dueStatus: 'PENDING', dueAt: '2026-12-01T00:00:00Z' }),
    ]);
    expect(dues.map((due) => due.poolId)).toEqual(['dated', 'none']);
  });
});

describe('totalOutstandingMinor', () => {
  it('is zero for nothing owed', () => {
    expect(totalOutstandingMinor([])).toBe('0');
  });

  it('sums exactly', () => {
    const dues = outstandingDues([
      joined({ id: 'p1', name: 'A', dueStatus: 'PENDING', amountMinor: '300000' }),
      joined({ id: 'p2', name: 'B', dueStatus: 'PENDING', amountMinor: '500000' }),
    ]);
    expect(totalOutstandingMinor(dues)).toBe('800000');
  });
});

describe('poolIsLive', () => {
  it.each([
    ['OPEN', true],
    ['DRAFT', false],
    ['CLOSED', false],
    ['CANCELLED', false],
  ] as const)('%s is live: %s', (status, expected) => {
    expect(poolIsLive({ status })).toBe(expected);
  });
});

describe('collectionSummary', () => {
  it('counts people rather than money', () => {
    // An organiser chases members, not naira.
    expect(
      collectionSummary({
        memberCount: 8,
        paidCount: 4,
        collectedMinor: '2250000',
        expectedMinor: '4000000',
        progressBps: 5625,
      }),
    ).toBe('4 of 8 paid');
  });
});

describe('progressBps', () => {
  it('reports the fraction collected in basis points', () => {
    expect(progressBps('2250000', '4000000')).toBe(5625);
  });

  it('reports nothing for a pool that expects nothing', () => {
    // Dividing by zero would be Infinity, and a pool with no members is not
    // "complete" — there is nothing yet to complete.
    expect(progressBps('0', '0')).toBe(0);
    expect(progressBps('500000', '0')).toBe(0);
  });

  it('caps an overpaid pool at the full bar', () => {
    expect(progressBps('5000000', '4000000')).toBe(10_000);
  });

  it('handles amounts beyond a safe integer without losing precision', () => {
    // Minor units are strings precisely because they can exceed 2^53; doing
    // this in floating point would round the answer.
    expect(progressBps('90071992547409910', '180143985094819820')).toBe(5000);
  });

  it('reports nothing rather than throwing on a malformed amount', () => {
    expect(progressBps('not-a-number', '4000000')).toBe(0);
  });
});

describe('expectedTotalMinor', () => {
  it('multiplies the shared amount by the member count', () => {
    expect(expectedTotalMinor('500000', 8)).toBe('4000000');
  });

  it('expects nothing from a pool nobody has joined', () => {
    expect(expectedTotalMinor('500000', 0)).toBe('0');
  });

  it('stays exact for amounts beyond a safe integer', () => {
    expect(expectedTotalMinor('9007199254740993', 3)).toBe('27021597764222979');
  });

  it('returns zero rather than throwing on a malformed amount', () => {
    expect(expectedTotalMinor('', 4)).toBe('0');
  });
});

describe('deadlineLabel', () => {
  it('words a real deadline as a date', () => {
    expect(deadlineLabel('2026-09-15T00:00:00Z', 'en-NG')).toMatch(/2026/);
  });

  it('says a pool has no deadline rather than leaving a blank', () => {
    expect(deadlineLabel(null)).toBe('No deadline');
    expect(deadlineLabel('not-a-date')).toBe('No deadline');
  });
});

describe('deadlineLabel timezone', () => {
  it('reads an end-of-day deadline as the day it was set, not the next one', () => {
    // Deadlines are stored as the last instant of a day in UTC. Formatted in
    // local time east of Greenwich that instant belongs to the following date,
    // which would show every member a deadline a day later than the real one.
    expect(deadlineLabel('2026-09-13T23:59:59.999Z', 'en-NG')).toMatch(/^13 /);
  });
});
