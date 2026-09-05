import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';

import {
  groupTone,
  poolPerCycleMinor,
  rotationProgressBps,
  roundLabel,
  roundProgressBps,
} from './group-summary';

describe('groupTone', () => {
  it('marks a running group as active', () => {
    expect(groupTone('ACTIVE')).toBe('active');
  });

  it.each(['OPEN', 'LOCKED'])('marks %s as needing attention', (status) => {
    // Waiting on members is not an error, but it is the state worth noticing.
    expect(groupTone(status)).toBe('attention');
  });

  it.each(['DRAFT', 'COMPLETED', 'SUSPENDED', 'CANCELLED'])('treats %s as neutral', (status) => {
    expect(groupTone(status)).toBe('neutral');
  });

  it('does not let an unknown status inherit the last branch', () => {
    expect(groupTone('SOMETHING_NEW')).toBe('neutral');
  });
});

describe('rotationProgressBps', () => {
  it('is zero when a group has no slots configured', () => {
    expect(rotationProgressBps({ maxSlots: 0, _count: { slots: 3, members: 3 } })).toBe(0);
  });

  it('measures slots rather than members', () => {
    // A member holding several slots fills several places; counting heads would
    // show a full group as half empty.
    expect(rotationProgressBps({ maxSlots: 8, _count: { slots: 8, members: 3 } })).toBe(10_000);
  });

  it('scales to basis points', () => {
    expect(rotationProgressBps({ maxSlots: 12, _count: { slots: 3, members: 3 } })).toBe(2500);
  });

  it('clamps rather than exceeding full', () => {
    expect(rotationProgressBps({ maxSlots: 4, _count: { slots: 9, members: 4 } })).toBe(10_000);
  });
});

describe('roundLabel', () => {
  const group = (sequence: number | null, maxSlots = 12) =>
    ({
      maxSlots,
      currentCycle: sequence === null ? null : { sequence, contributionDueAt: '', status: 'OPEN' },
    }) as Pick<AjoGroupSummary, 'maxSlots' | 'currentCycle'>;

  it('names the round in progress', () => {
    expect(roundLabel(group(3))).toBe('Round 3/12');
  });

  it('is null before the rotation starts', () => {
    // "Round 0" describes nothing: a group that has not begun has no round.
    expect(roundLabel(group(null))).toBeNull();
    expect(roundLabel(group(0))).toBeNull();
  });
});

describe('roundProgressBps', () => {
  const group = (sequence: number, maxSlots = 12) =>
    ({
      maxSlots,
      currentCycle: { sequence, contributionDueAt: '', status: 'OPEN' },
    }) as Pick<AjoGroupSummary, 'maxSlots' | 'currentCycle'>;

  it('measures rounds completed, not slots filled', () => {
    expect(roundProgressBps(group(3, 12))).toBe(2500);
  });

  it('is zero before the first round', () => {
    expect(roundProgressBps(group(0))).toBe(0);
  });

  it('clamps at full rather than exceeding it', () => {
    expect(roundProgressBps(group(20, 12))).toBe(10_000);
  });

  it('does not divide by an unset slot count', () => {
    expect(roundProgressBps(group(3, 0))).toBe(0);
  });
});

describe('poolPerCycleMinor', () => {
  const group = (baseContributionMinor: string, slots: number) =>
    ({
      baseContributionMinor,
      _count: { slots, members: slots },
    }) as Pick<AjoGroupSummary, 'baseContributionMinor' | '_count'>;

  it('multiplies by slots, not by members', () => {
    // In a flexible group one member can hold several slots, so the pool is
    // larger than headcount times the base.
    expect(poolPerCycleMinor(group('5000000', 7))).toBe('35000000');
  });

  it('stays exact past the safe integer range', () => {
    expect(poolPerCycleMinor(group('9007199254740993', 2))).toBe('18014398509481986');
  });

  it('is zero rather than NaN for a malformed amount', () => {
    expect(poolPerCycleMinor(group('not a number', 4))).toBe('0');
  });
});
