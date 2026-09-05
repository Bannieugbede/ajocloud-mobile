import { apiClient } from '@/api/client/api-client';

/** A collection pool. Amounts are minor-unit strings; see the backend's ADR-007. */
export type AkawoPool = {
  id: string;
  name: string;
  purpose: string | null;
  amountMinor: string;
  currency: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  referenceLabel: string;
  dueAt: string | null;
  closedAt: string | null;
  createdAt: string;
  /** Who is collecting. Present on the joined list; absent elsewhere. */
  organiserName?: string;
};

export type AkawoDue = {
  id: string;
  amountMinor: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'WAIVED';
  paidAt: string | null;
};

export type AkawoPoolMember = {
  id: string;
  fullName: string;
  reference: string;
  status: 'ACTIVE' | 'REMOVED';
  joinedAt: string;
  due: AkawoDue | null;
};

export type PoolTotals = {
  memberCount: number;
  paidCount: number;
  collectedMinor: string;
  expectedMinor: string;
  progressBps: number;
};

/** Returned once on creation — the only time the plaintext join code exists. */
export type CreatedAkawoPool = AkawoPool & { joinCode: string };

export type OrganiserPoolView = AkawoPool & PoolTotals & { members: AkawoPoolMember[] };

export type MemberPoolView = {
  membership: Omit<AkawoPoolMember, 'due'>;
  pool: AkawoPool;
  due: AkawoDue | null;
  memberCount: number;
  paidCount: number;
  collectedMinor: string;
};

export type JoinedPool = { membershipId: string; pool: AkawoPool; due: AkawoDue | null };

export type PoolPreview = {
  id: string;
  name: string;
  purpose: string | null;
  amountMinor: string;
  currency: string;
  referenceLabel: string;
  dueAt: string | null;
  organiserName: string;
};

function client() {
  if (!apiClient) throw new Error('API configuration is unavailable');
  return apiClient;
}

export function createAkawoPool(body: {
  name: string;
  purpose?: string;
  amountMinor: string;
  referenceLabel?: string;
  dueAt?: string;
}): Promise<CreatedAkawoPool> {
  return client().request('/api/v1/akawo/pools', { method: 'POST', body });
}

export function listOrganisedPools(): Promise<(AkawoPool & PoolTotals)[]> {
  return client().request('/api/v1/akawo/pools/organised');
}

export function listJoinedPools(): Promise<JoinedPool[]> {
  return client().request('/api/v1/akawo/pools/joined');
}

export function previewPool(joinCode: string): Promise<PoolPreview> {
  return client().request(`/api/v1/akawo/pools/preview?joinCode=${encodeURIComponent(joinCode)}`);
}

export function joinAkawoPool(body: {
  joinCode: string;
  fullName: string;
  reference: string;
}): Promise<{ poolId: string; due: AkawoDue }> {
  return client().request('/api/v1/akawo/pools/join', { method: 'POST', body });
}

export function getOrganiserPool(poolId: string): Promise<OrganiserPoolView> {
  return client().request(`/api/v1/akawo/pools/${encodeURIComponent(poolId)}/organiser`);
}

export function getMemberPool(poolId: string): Promise<MemberPoolView> {
  return client().request(`/api/v1/akawo/pools/${encodeURIComponent(poolId)}`);
}

export function openAkawoPool(poolId: string): Promise<AkawoPool> {
  return client().request(`/api/v1/akawo/pools/${encodeURIComponent(poolId)}/open`, {
    method: 'POST',
  });
}

export function closeAkawoPool(poolId: string): Promise<AkawoPool> {
  return client().request(`/api/v1/akawo/pools/${encodeURIComponent(poolId)}/close`, {
    method: 'POST',
  });
}

export function cancelAkawoPool(poolId: string): Promise<AkawoPool> {
  return client().request(`/api/v1/akawo/pools/${encodeURIComponent(poolId)}/cancel`, {
    method: 'POST',
  });
}

export function removePoolMember(poolId: string, memberId: string): Promise<AkawoPoolMember> {
  return client().request(
    `/api/v1/akawo/pools/${encodeURIComponent(poolId)}/members/${encodeURIComponent(memberId)}/remove`,
    { method: 'POST' },
  );
}

export function waivePoolDue(poolId: string, memberId: string, reason: string): Promise<AkawoDue> {
  return client().request(
    `/api/v1/akawo/pools/${encodeURIComponent(poolId)}/members/${encodeURIComponent(memberId)}/waive`,
    { method: 'POST', body: { reason } },
  );
}
