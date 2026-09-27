import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';

import {
  joinAjoGroup,
  previewGroupInvitation,
  resolveInvitationGroup,
} from '@/api/endpoints/ajo-groups';
import { JoinGroupScreen, type ResolvedGroup } from '@/features/ajo/join-group-screen';
import type { AppError } from '@/types/errors';

export default function JoinAjoGroupRoute() {
  const queryClient = useQueryClient();
  // Present when the screen was reached from an invitation link, which already
  // carries both values; absent when the code is being typed in by hand.
  const { groupId, invitationCode } = useLocalSearchParams<{
    groupId?: string;
    invitationCode?: string;
  }>();

  const [verified, setVerified] = useState<{
    groupId: string;
    groupName: string;
    code: string;
  } | null>(groupId ? { groupId, groupName: '', code: invitationCode ?? '' } : null);

  const verify = useMutation({
    mutationFn: (code: string) => resolveInvitationGroup(code),
    onSuccess: (group, code) => setVerified({ ...group, code }),
  });

  // The public invitation details behind the confirm step: contribution,
  // cadence and how full the group is. Cached from the invitation landing
  // screen when the flow started from a link; best-effort otherwise, so a
  // legacy code that has no preview still joins with its name alone.
  const previewCode = verified?.code || invitationCode || null;
  const preview = useQuery({
    queryKey: ['group-invitation', previewCode],
    queryFn: () => previewGroupInvitation(previewCode as string),
    enabled: Boolean(previewCode),
    staleTime: 60_000,
    retry: false,
  });

  const resolved = useMemo<ResolvedGroup | null>(() => {
    if (!verified) return null;
    return {
      groupId: verified.groupId,
      groupName: verified.groupName || preview.data?.groupName || '',
      preview: preview.data ?? null,
    };
  }, [verified, preview.data]);

  const join = useMutation({
    meta: { successMessage: 'You’ve joined the group.' },
    mutationFn: (input: { groupId: string; invitationCode: string; requestedSlots: number }) =>
      joinAjoGroup(input.groupId, {
        invitationCode: input.invitationCode,
        requestedSlots: input.requestedSlots,
      }).then(() => input.groupId),
    onSuccess: (joinedId) => {
      void queryClient.invalidateQueries({ queryKey: ['ajo-groups'] });
      // replace: backing into the code form would offer to join again, and a
      // second join would take more positions than the member intended.
      router.replace({ pathname: '/(tabs)/ajo/[groupId]', params: { groupId: joinedId } });
    },
  });

  return (
    <JoinGroupScreen
      initialInvitationCode={invitationCode ?? ''}
      codeLocked={Boolean(groupId)}
      resolved={resolved}
      verifying={verify.isPending}
      submitting={join.isPending}
      loadingPreview={Boolean(previewCode) && preview.isPending}
      // Whichever step the member is on is the one whose failure they need to
      // see; showing a stale verify error beside a failed join would confuse.
      error={(join.error ?? verify.error) as AppError | null}
      onVerify={(code) => verify.mutate(code)}
      onSubmit={(input) => join.mutate(input)}
    />
  );
}
