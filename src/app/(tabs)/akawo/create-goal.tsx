import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { createAkawoGoal, type CreateAkawoGoalInput } from '@/api/endpoints/akawo';
import { CreateGoalScreen } from '@/features/akawo/create-goal-screen';
import type { AppError } from '@/types/errors';
import { KycGate } from '@/features/kyc/kyc-gate';

function CreateAkawoGoalRouteContent() {
  const queryClient = useQueryClient();

  const create = useMutation({
    meta: { successMessage: 'Your Akawo goal is ready.' },
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

/** Shown once the member has reached the stage `akawo-goal.create` needs (ADR-015). */
export default function CreateAkawoGoalRoute() {
  return (
    <KycGate action="akawo-goal.create">
      <CreateAkawoGoalRouteContent />
    </KycGate>
  );
}
