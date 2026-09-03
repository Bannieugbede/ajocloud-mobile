import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { previewGroupInvitation, resolveInvitationGroup } from '@/api/endpoints/ajo-groups';
import { InviteLandingScreen } from '@/features/ajo/invite-landing-screen';
import { isPlausibleInvitationCode } from '@/services/incoming-link';
import { holdInvitation } from '@/services/pending-invitation';
import { restoreSession } from '@/services/session-storage';
import type { AppError } from '@/types/errors';

/**
 * Where an invitation link lands.
 *
 * Reached from `ajocloud://join/CODE`, from the website's matching page, and
 * from a push notification. The reader may not be signed in — an invitation is
 * frequently someone's first contact with the app — so the group is described
 * first and the account is asked for only when they accept.
 */
export default function JoinByCodeRoute() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<AppError | null>(null);

  const valid = typeof code === 'string' && isPlausibleInvitationCode(code);

  const preview = useQuery({
    queryKey: ['group-invitation', code],
    queryFn: () => previewGroupInvitation(code),
    enabled: valid,
    // An invitation that has just been spent should say so rather than serve a
    // stale "still open" from cache.
    staleTime: 0,
    retry: false,
  });

  const session = useQuery({
    queryKey: ['session-present'],
    queryFn: async () => (await restoreSession()) !== null,
  });

  const signedIn = session.data === true;

  const accept = async () => {
    if (!valid) return;

    if (!signedIn) {
      // Held across sign-in so the invitation is not lost to the detour. The
      // auth flow reads it back and returns here.
      await holdInvitation(code);
      router.push('/(auth)/sign-in');
      return;
    }

    setResolving(true);
    setResolveError(null);
    try {
      // The public preview withholds the group id deliberately; a signed-in
      // caller exchanges the code for it here, so nobody has to type it.
      const { groupId } = await resolveInvitationGroup(code);
      router.replace({
        pathname: '/(tabs)/ajo/join',
        params: { groupId, invitationCode: code },
      });
    } catch (error) {
      setResolveError(error as AppError);
    } finally {
      setResolving(false);
    }
  };

  return (
    <InviteLandingScreen
      preview={preview.data ?? null}
      loading={valid && (preview.isPending || session.isPending)}
      error={
        valid
          ? ((resolveError ?? preview.error) as AppError | null)
          : ({
              kind: 'validation',
              message: 'This invitation link is incomplete. Ask whoever sent it for a new one.',
            } as AppError)
      }
      submitting={resolving}
      signedIn={signedIn}
      onAccept={() => void accept()}
      onDecline={() => router.replace('/(tabs)/ajo')}
    />
  );
}
