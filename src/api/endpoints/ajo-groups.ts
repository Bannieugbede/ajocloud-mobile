import { apiClient } from '@/api/client/api-client';

export type AjoGroupSummary = {
  id: string;
  name: string;
  status: string;
  contributionFrequency: string;
  contributionMode: string;
  baseContributionMinor: string;
  currency: string;
  maxSlots: number;
  maxMembers: number;
  startDate: string;
  endDate: string;
  _count: { slots: number; members: number };
};

export type AjoMember = {
  id: string;
  userId: string;
  role: string;
  status: string;
  /** Name only — the backend deliberately never exposes a member's email. */
  displayName: string;
  _count: { slots: number };
};

/** A position in the rotation. A swap is expressed as a pair of these ids. */
export type AjoSlot = {
  id: string;
  memberId: string;
  position: number;
  status: string;
};

export type AjoGroupDetail = AjoGroupSummary & {
  description: string | null;
  minSlotsPerMember: number;
  maxSlotsPerMember: number;
  businessTimezone: string;
  lockedAt: string | null;
  members: AjoMember[];
  slots: AjoSlot[];
};

export type AjoScheduleRow = {
  slotId: string;
  amountDueMinor: string;
  amountPaidMinor: string;
  currency: string;
  status: string;
};

/**
 * One cycle of the rotation.
 *
 * `contributionSchedules` is scoped by the caller's role: an admin sees every
 * member's row, an ordinary member sees only their own. A screen must not
 * assume it has the whole group.
 */
export type AjoCycle = {
  sequence: number;
  contributionDueAt: string;
  payoutDueAt: string;
  status: string;
  contributionSchedules: AjoScheduleRow[];
  payoutSchedules: AjoScheduleRow[];
};

export type CreateAjoGroupInput = {
  name: string;
  contributionFrequency: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  contributionMode?: 'FIXED' | 'FLEXIBLE_UNIT';
  baseContributionMinor: string;
  contributionUnitMinor?: string;
  maxSlots: number;
  requestedSlots: number;
  minSlotsPerMember?: number;
  /** Omit to allow up to the group's own capacity. */
  maxSlotsPerMember?: number;
  startDate: string;
  endDate: string;
};

/** The invitation code is returned only here and cannot be fetched again. */
export type CreatedAjoGroup = {
  id: string;
  name: string;
  status: string;
  invitationCode: string;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function listAjoGroups(): Promise<AjoGroupSummary[]> {
  return client().request('/api/v1/ajo-groups');
}

export function getAjoGroup(groupId: string): Promise<AjoGroupDetail> {
  return client().request(`/api/v1/ajo-groups/${encodeURIComponent(groupId)}`);
}

export function getAjoSchedule(groupId: string): Promise<AjoCycle[]> {
  return client().request(`/api/v1/ajo-groups/${encodeURIComponent(groupId)}/schedule`);
}

/**
 * Creates a group. Requires the `ajo.create` permission, so this can fail with
 * a 403 for an ordinary member even though the screen rendered.
 */
export function createAjoGroup(input: CreateAjoGroupInput): Promise<CreatedAjoGroup> {
  return client().request('/api/v1/ajo-groups', { method: 'POST', body: input });
}

/**
 * What a shared invitation link says about its group.
 *
 * Read without a session: the link may be opened by someone who has just
 * installed the app and has not signed in yet, so the screen can show what they
 * were invited to before asking them to.
 */
export type GroupInvitePreview = {
  groupName: string;
  inviterName: string;
  contributionAmountMinor: string;
  currency: string;
  contributionFrequency: string;
  memberCount: number;
  maxMembers: number;
  expiresAt: string;
};

export function previewGroupInvitation(code: string): Promise<GroupInvitePreview> {
  return client().request(`/api/v1/invitations/${encodeURIComponent(code)}`);
}

/** Issues a shareable invitation link. The code is returned only here. */
export type IssuedInvitation = {
  id: string;
  code: string;
  url: string;
  maxUses: number;
  useCount: number;
  remainingUses: number;
  expiresAt: string;
};

export function createGroupInvitation(
  groupId: string,
  input: { maxUses?: number } = {},
): Promise<IssuedInvitation> {
  return client().request(`/api/v1/ajo-groups/${encodeURIComponent(groupId)}/invitations`, {
    method: 'POST',
    body: input,
  });
}

/**
 * Exchanges an invitation code for the group it admits.
 *
 * Authenticated, unlike the preview: this returns a group id, which the public
 * endpoint withholds so that a forwarded link discloses nothing addressable.
 */
export function resolveInvitationGroup(
  code: string,
): Promise<{ groupId: string; groupName: string }> {
  return client().request(`/api/v1/ajo-groups/invitations/${encodeURIComponent(code)}/group`);
}

export function joinAjoGroup(
  groupId: string,
  input: { invitationCode: string; requestedSlots: number },
): Promise<unknown> {
  return client().request(`/api/v1/ajo-groups/${encodeURIComponent(groupId)}/join`, {
    method: 'POST',
    body: input,
  });
}

/**
 * Locks the rotation, which generates the schedule. Irreversible: a locked
 * schedule is immutable, so the screen must confirm before calling this.
 */
export function lockAjoGroup(groupId: string): Promise<unknown> {
  return client().request(`/api/v1/ajo-groups/${encodeURIComponent(groupId)}/lock`, {
    method: 'POST',
  });
}

/** One side of a proposed swap, named for display. */
export type AjoSwapSide = {
  slotId: string;
  position: number | null;
  memberId: string | null;
  displayName: string;
};

export type AjoSwapApproval = {
  approverMemberId: string;
  decision: 'APPROVED' | 'REJECTED';
  reason: string | null;
  decidedAt: string;
};

export type AjoSwapRequest = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'EXPIRED' | 'CANCELLED';
  initiatorType: string;
  requestedByMemberId: string;
  from: AjoSwapSide;
  to: AjoSwapSide;
  reason: string | null;
  expiresAt: string | null;
  decidedAt: string | null;
  executedAt: string | null;
  createdAt: string;
  approvals: AjoSwapApproval[];
  /** Server-computed: it depends on who owns the two affected positions, which
      the client would otherwise have to re-derive and could get wrong. */
  awaitingMyDecision: boolean;
};

export function listAjoSwaps(groupId: string): Promise<AjoSwapRequest[]> {
  return client().request(`/api/v1/ajo-groups/${encodeURIComponent(groupId)}/swaps`);
}

export function requestAjoSwap(
  groupId: string,
  input: { fromSlotId: string; toSlotId: string; reason?: string },
): Promise<unknown> {
  return client().request(`/api/v1/ajo-groups/${encodeURIComponent(groupId)}/swaps`, {
    method: 'POST',
    body: input,
  });
}

export function approveAjoSwap(groupId: string, swapId: string, reason?: string): Promise<unknown> {
  return client().request(
    `/api/v1/ajo-groups/${encodeURIComponent(groupId)}/swaps/${encodeURIComponent(swapId)}/approve`,
    { method: 'POST', body: reason ? { reason } : {} },
  );
}

export function rejectAjoSwap(groupId: string, swapId: string, reason?: string): Promise<unknown> {
  return client().request(
    `/api/v1/ajo-groups/${encodeURIComponent(groupId)}/swaps/${encodeURIComponent(swapId)}/reject`,
    { method: 'POST', body: reason ? { reason } : {} },
  );
}
