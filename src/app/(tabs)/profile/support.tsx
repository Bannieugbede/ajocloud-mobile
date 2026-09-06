import { useMutation, useQuery } from '@tanstack/react-query';
import { Linking } from 'react-native';

import { createSupportInquiry, getCurrentUser } from '@/api/endpoints/users';
import { SupportScreen } from '@/features/profile/support-screen';
import { supportEmail, supportMailto } from '@/features/profile/support-faqs';
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

  const address = supportEmail();

  return (
    <SupportScreen
      submitting={send.isPending}
      error={send.error as AppError | null}
      sent={send.isSuccess}
      supportAddress={address}
      onSubmit={(input) => send.mutate(input)}
      onStartAnother={() => send.reset()}
      onEmailSupport={() => {
        // Nothing to fall back to if no mail app can open the link: the address
        // is already on screen for anyone who would rather copy it.
        if (address) void Linking.openURL(supportMailto(address)).catch(() => {});
      }}
    />
  );
}
