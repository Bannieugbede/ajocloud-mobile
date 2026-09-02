import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { createAjoGroup, type CreateAjoGroupInput } from '@/api/endpoints/ajo-groups';
import { CreateGroupScreen } from '@/features/ajo/create-group-screen';
import type { AppError } from '@/types/errors';

export default function CreateAjoGroupRoute() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (input: CreateAjoGroupInput) => createAjoGroup(input),
    onSuccess: (group) => {
      void queryClient.invalidateQueries({ queryKey: ['ajo-groups'] });
      // replace: backing into the submitted form would create a second group.
      // The invitation code is in this response and nowhere else, so it is
      // carried to the next screen rather than refetched.
      router.replace({
        pathname: '/(tabs)/ajo/invitation',
        params: {
          groupId: group.id,
          groupName: group.name,
          invitationCode: group.invitationCode,
        },
      });
    },
  });

  return (
    <CreateGroupScreen
      submitting={create.isPending}
      error={create.error as AppError | null}
      onSubmit={(input) => create.mutate(input)}
    />
  );
}
