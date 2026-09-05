import type { JoinedPool } from '@/api/endpoints/akawo-pools';

import {
  collectionSummary,
  outstandingDues,
  poolIsLive,
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
