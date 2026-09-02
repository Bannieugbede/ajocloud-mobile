import type { AjoCycle, AjoGroupDetail, AjoSlot } from '@/api/endpoints/ajo-groups';

export type RotationRow = {
  sequence: number;
  slotId: string;
  position: number;
  /** Who receives this payout. */
  holderName: string;
  payoutDueAt: string;
  amountDueMinor: string;
  amountPaidMinor: string;
  currency: string;
  status: string;
  /** True when this is one of the viewer's own positions. */
  isMine: boolean;
};

/**
 * Joins the schedule to the group's slots and members.
 *
 * The schedule endpoint returns only slot ids, so on its own it cannot say who
 * is paid in which round. The names live on the group detail, which is why both
 * are fetched for this screen.
 */
export function buildRotation(
  cycles: readonly AjoCycle[],
  group: Pick<AjoGroupDetail, 'slots' | 'members'>,
  viewerUserId: string | null,
): RotationRow[] {
  const slotById = new Map<string, AjoSlot>(group.slots.map((slot) => [slot.id, slot]));
  const memberById = new Map(group.members.map((member) => [member.id, member]));

  return cycles.flatMap((cycle) =>
    cycle.payoutSchedules.map((payout) => {
      const slot = slotById.get(payout.slotId);
      const member = slot ? memberById.get(slot.memberId) : undefined;
      return {
        sequence: cycle.sequence,
        slotId: payout.slotId,
        // A slot missing from the group payload is possible if it was removed
        // between the two requests; the row still renders rather than crashing.
        position: slot?.position ?? 0,
        holderName: member?.displayName ?? 'Member',
        payoutDueAt: cycle.payoutDueAt,
        amountDueMinor: payout.amountDueMinor,
        amountPaidMinor: payout.amountPaidMinor,
        currency: payout.currency,
        status: payout.status,
        isMine: Boolean(viewerUserId && member?.userId === viewerUserId),
      };
    }),
  );
}

/**
 * The viewer's own unpaid contributions, soonest first.
 *
 * A member's schedule already contains only their rows; an admin's contains
 * everyone's, so it is filtered by slot ownership rather than trusted wholesale.
 */
export function outstandingContributions(
  cycles: readonly AjoCycle[],
  group: Pick<AjoGroupDetail, 'slots' | 'members'>,
  viewerUserId: string | null,
): { sequence: number; slotId: string; dueAt: string; amountMinor: string; currency: string }[] {
  const mySlotIds = new Set(
    group.slots
      .filter((slot) => {
        const member = group.members.find((candidate) => candidate.id === slot.memberId);
        return Boolean(viewerUserId && member?.userId === viewerUserId);
      })
      .map((slot) => slot.id),
  );

  return cycles
    .flatMap((cycle) =>
      cycle.contributionSchedules
        .filter((row) => mySlotIds.has(row.slotId) && row.status !== 'PAID')
        .map((row) => ({
          sequence: cycle.sequence,
          slotId: row.slotId,
          dueAt: cycle.contributionDueAt,
          amountMinor: row.amountDueMinor,
          currency: row.currency,
        })),
    )
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

/** Only a group admin may lock, and only before the schedule exists. */
export function canLock(
  group: Pick<AjoGroupDetail, 'status' | 'members'>,
  viewerUserId: string | null,
): boolean {
  const isAdmin = group.members.some(
    (member) =>
      member.userId === viewerUserId && member.role === 'GROUP_ADMIN' && member.status === 'ACTIVE',
  );
  return isAdmin && (group.status === 'DRAFT' || group.status === 'OPEN');
}

/** A rotation needs at least two positions taken, or there is nothing to rotate. */
export const MIN_SLOTS_TO_LOCK = 2;

/**
 * Why locking is not yet possible, or null when it is.
 *
 * The backend refuses to lock a group with fewer than two taken positions,
 * which is correct but only discoverable by trying. Reporting it before the tap
 * tells the administrator what to do — share the invitation — instead of
 * showing a failure they cannot act on.
 */
export function lockBlockedReason(group: Pick<AjoGroupDetail, 'slots'>): string | null {
  const taken = group.slots.length;
  if (taken >= MIN_SLOTS_TO_LOCK) return null;
  return `A rotation needs at least ${MIN_SLOTS_TO_LOCK} positions taken before it can start. ${taken} is taken so far, so share the invitation first.`;
}

/** Swaps trade positions, so they need a locked rotation and someone to trade with. */
export function canRequestSwap(group: Pick<AjoGroupDetail, 'status' | 'slots'>): boolean {
  return group.status === 'LOCKED' && group.slots.length > 1;
}
