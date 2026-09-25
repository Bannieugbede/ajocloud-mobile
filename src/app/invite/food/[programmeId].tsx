import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { AppLoadingState } from '@/components/ui/app-state';
import { previewFoodProgramme } from '@/api/endpoints/food-ajo';
import { isProgrammeId, normaliseProgrammeRef } from '@/services/incoming-link';
import { holdDestination } from '@/services/pending-invitation';
import { holdReferral } from '@/services/pending-referral';
import { restoreSession } from '@/services/session-storage';

/**
 * Where a shared Food Ajo programme link lands in the app (`/f/<code>` on the
 * website, or `/food/<id>` from before short codes, redirected here by
 * `+native-intent`).
 *
 * A short code is exchanged for the programme id through the public preview,
 * which needs no session, because every other programme screen and call is
 * keyed by id. A programme the preview does not describe (finished, or never
 * opened) goes to the Food tab, as an unknown id always has.
 *
 * The programme screen lives in the tabs, which assume a session. Signed in,
 * this goes straight there. Signed out, the programme is held and the person
 * signs in first, then lands on it.
 */
export default function FoodLinkRoute() {
  const { programmeId, ref } = useLocalSearchParams<{ programmeId: string; ref?: string }>();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (typeof ref === 'string') await holdReferral(ref).catch(() => undefined);
      const signedIn = (await restoreSession().catch(() => null)) !== null;
      const linked = normaliseProgrammeRef(programmeId);
      const resolvedId =
        linked && !isProgrammeId(linked)
          ? await previewFoodProgramme(linked)
              .then((found) => found.id)
              .catch(() => null)
          : linked;
      if (cancelled) return;
      if (!isProgrammeId(resolvedId)) {
        router.replace(signedIn ? '/(tabs)/food' : '/(auth)/sign-in');
        return;
      }
      if (signedIn) {
        router.replace({
          pathname: '/(tabs)/food/[programmeId]',
          params: { programmeId: resolvedId },
        });
        return;
      }
      await holdDestination({ kind: 'food', programmeId: resolvedId }).catch(() => undefined);
      if (!cancelled) router.replace('/(auth)/sign-in');
    })();
    return () => {
      cancelled = true;
    };
  }, [programmeId, ref]);

  return <AppLoadingState label="Opening the programme" />;
}
