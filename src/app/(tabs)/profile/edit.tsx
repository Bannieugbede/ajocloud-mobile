import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getCurrentUser, updateProfile, type CurrentUser } from '@/api/endpoints/users';
import { AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { EditProfileScreen } from '@/features/profile/edit-profile-screen';
import { mergeProfile } from '@/features/profile/merge-profile';
import type { AppError } from '@/types/errors';

export default function EditProfileRoute() {
  const queryClient = useQueryClient();
  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser });

  const save = useMutation({
    mutationFn: (input: { firstName: string; lastName: string }) => updateProfile(input),
    onSuccess: (profile) => {
      // The response is the profile alone, so it is merged into the cached user
      // rather than replacing it - assigning it wholesale would blank the email
      // and status on every screen that reads them.
      queryClient.setQueryData(['current-user'], (current: CurrentUser | undefined) =>
        mergeProfile(current, profile),
      );
    },
  });

  if (user.isPending) return <AppLoadingState label="Loading your profile" />;
  if (user.isError || !user.data) {
    return (
      <AppErrorState
        description="Could not load your profile."
        onRetry={() => void user.refetch()}
      />
    );
  }

  return (
    <EditProfileScreen
      firstName={user.data.profile.firstName}
      lastName={user.data.profile.lastName}
      email={user.data.email}
      submitting={save.isPending}
      error={save.error as AppError | null}
      saved={save.isSuccess}
      onSubmit={(input) => save.mutate(input)}
    />
  );
}
