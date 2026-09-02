import { useMutation, useQuery } from '@tanstack/react-query';

import { createSupportInquiry, getCurrentUser } from '@/api/endpoints/users';
import { SupportScreen } from '@/features/profile/support-screen';
import type { AppError } from '@/types/errors';

export default function SupportRoute() {
  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser });

  const send = useMutation({
    mutationFn: (input: { subject: string; message: string }) => {
      const profile = user.data?.profile;
      // Taken from the account rather than asked for: the endpoint is shared
      // with the public site, which has no signed-in user to read them from.
      return createSupportInquiry({
        name: profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Member',
        email: user.data?.email ?? '',
        ...input,
      });
    },
  });

  return (
    <SupportScreen
      submitting={send.isPending}
      error={send.error as AppError | null}
      sent={send.isSuccess}
      onSubmit={(input) => send.mutate(input)}
      onStartAnother={() => send.reset()}
    />
  );
}
