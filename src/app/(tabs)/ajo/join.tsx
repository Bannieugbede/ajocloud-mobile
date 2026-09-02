import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { joinAjoGroup } from '@/api/endpoints/ajo-groups';
import { JoinGroupScreen } from '@/features/ajo/join-group-screen';
import type { AppError } from '@/types/errors';

export default function JoinAjoGroupRoute() {
  const queryClient = useQueryClient();

  const join = useMutation({
    mutationFn: (input: { groupId: string; invitationCode: string; requestedSlots: number }) =>
      joinAjoGroup(input.groupId, {
        invitationCode: input.invitationCode,
        requestedSlots: input.requestedSlots,
      }).then(() => input.groupId),
    onSuccess: (groupId) => {
      void queryClient.invalidateQueries({ queryKey: ['ajo-groups'] });
      // replace: backing into the code form would offer to join again, and a
      // second join would take more positions than the member intended.
      router.replace({ pathname: '/(tabs)/ajo/[groupId]', params: { groupId } });
    },
  });

  return (
    <JoinGroupScreen
      submitting={join.isPending}
      error={join.error as AppError | null}
      onSubmit={(input) => join.mutate(input)}
    />
  );
}
