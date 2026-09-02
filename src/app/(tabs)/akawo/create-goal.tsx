import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { createAkawoGoal, type CreateAkawoGoalInput } from '@/api/endpoints/akawo';
import { CreateGoalScreen } from '@/features/akawo/create-goal-screen';
import type { AppError } from '@/types/errors';

export default function CreateAkawoGoalRoute() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (input: CreateAkawoGoalInput) => createAkawoGoal(input),
    onSuccess: (goal) => {
      void queryClient.invalidateQueries({ queryKey: ['akawo-goals'] });
      // replace: backing into the submitted form would create a second goal.
      router.replace({ pathname: '/(tabs)/akawo/[goalId]', params: { goalId: goal.id } });
    },
  });

  return (
    <CreateGoalScreen
      submitting={create.isPending}
      error={create.error as AppError | null}
      onSubmit={(input) => create.mutate(input)}
    />
  );
}
