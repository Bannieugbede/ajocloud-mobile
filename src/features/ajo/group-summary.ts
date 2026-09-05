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
