import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { joinAjoGroup, resolveInvitationGroup } from '@/api/endpoints/ajo-groups';
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

  // A link that already names its group skips the verify stage: it was resolved
  // when the link was opened, so asking again would be a wasted round trip.
  const [resolved, setResolved] = useState<ResolvedGroup | null>(
    groupId ? { groupId, groupName: '' } : null,
  );

  const verify = useMutation({
    mutationFn: (code: string) => resolveInvitationGroup(code),
    onSuccess: (group) => setResolved(group),
  });

  const join = useMutation({
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
      resolved={resolved}
      verifying={verify.isPending}
      submitting={join.isPending}
      // Whichever step the member is on is the one whose failure they need to
      // see; showing a stale verify error beside a failed join would confuse.
      error={(join.error ?? verify.error) as AppError | null}
      onVerify={(code) => verify.mutate(code)}
      onSubmit={(input) => join.mutate(input)}
    />
  );
}
