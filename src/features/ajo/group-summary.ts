import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';

/**
 * How a group's card should read, derived from its status.
 *
 * Kept out of the component so the mapping is one rule rather than a chain of
 * ternaries repeated per screen, and so a new status cannot quietly fall
 * through to whatever the last branch happened to be.
 */
export type GroupTone = 'active' | 'attention' | 'neutral';

export function groupTone(status: string): GroupTone {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    // A group needing something from its members reads as attention rather than
    // as an error: nothing has gone wrong, it is simply waiting on someone.
    case 'OPEN':
    case 'LOCKED':
      return 'attention';
    default:
      return 'neutral';
  }
}

/**
 * How full a group's rotation is, in basis points.
 *
 * Slots rather than members, because a member holding several slots fills
 * several places: counting heads would show a full group as half empty.
 */
export function rotationProgressBps(group: Pick<AjoGroupSummary, 'maxSlots' | '_count'>): number {
  if (group.maxSlots <= 0) return 0;
  const filled = Math.round((group._count.slots / group.maxSlots) * 10_000);
  return Math.max(0, Math.min(10_000, filled));
}

/**
 * Where the rotation has reached, as the design phrases it: "Round 3/12".
 *
 * Null when no cycle has started, because "Round 0" describes nothing — a
 * group that has not begun has no round rather than a zeroth one.
 */
export function roundLabel(
  group: Pick<AjoGroupSummary, 'maxSlots' | 'currentCycle'>,
): string | null {
  const sequence = group.currentCycle?.sequence;
  if (!sequence || sequence < 1) return null;
  return `Round ${sequence}/${group.maxSlots}`;
}

/**
 * How far through the rotation the group is, in basis points.
 *
 * Rounds completed rather than slots filled: once a group is running, what a
 * member wants to know is how much of the cycle is behind them, not whether
 * the group is full.
 */
export function roundProgressBps(
  group: Pick<AjoGroupSummary, 'maxSlots' | 'currentCycle'>,
): number {
  const sequence = group.currentCycle?.sequence ?? 0;
  if (group.maxSlots <= 0 || sequence < 1) return 0;
  return Math.max(0, Math.min(10_000, Math.round((sequence / group.maxSlots) * 10_000)));
}

/**
 * The whole pool one cycle collects, for a flexible group where members hold
 * different numbers of slots and the total is not headcount times the base.
 */
export function poolPerCycleMinor(
  group: Pick<AjoGroupSummary, 'baseContributionMinor' | '_count'>,
): string {
  const base = /^\d+$/.test(group.baseContributionMinor) ? BigInt(group.baseContributionMinor) : 0n;
  return (base * BigInt(Math.max(0, group._count.slots))).toString();
}
