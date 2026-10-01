import { useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { createFoodProgramme } from '@/api/endpoints/food-ajo';
import { AdminCreateFoodScreen } from '@/features/food/admin-create-screen';
import { KycGate } from '@/features/kyc/kyc-gate';

function CreateFoodGroupContent() {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: createFoodProgramme,
    meta: { successMessage: 'Food group created' },
    onSuccess: (programme) => {
      void queryClient.invalidateQueries({ queryKey: ['food-programmes', 'COORDINATED'] });
      void queryClient.invalidateQueries({ queryKey: ['food-programmes'] });
      router.replace({
        pathname: '/(tabs)/profile/admin/food/[programmeId]',
        params: { programmeId: programme.id },
      } as unknown as import('expo-router').Href);
    },
  });
  return (
    <AdminCreateFoodScreen
      submitting={create.isPending}
      onSubmit={(input) => create.mutate(input)}
    />
  );
}

export default function CreateFoodGroupRoute() {
  return (
    <KycGate action="food-programme.create">
      <CreateFoodGroupContent />
    </KycGate>
  );
}
