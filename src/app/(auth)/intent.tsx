import { router } from 'expo-router';

import { postSignInRoute } from '@/features/auth/post-sign-in-route';
import { IntentStep } from '@/features/registration/intent-step';
import { useRegistrationStore } from '@/store/registration-store';

export default function IntentRoute() {
  const finish = useRegistrationStore((state) => state.finish);

  return (
    <IntentStep
      onContinue={() => {
        finish();
        // The end of sign-up is a sign-in too. Someone who opened an
        // invitation, and had to create an account to accept it, goes back to
        // that invitation rather than being dropped on the home tab.
        void postSignInRoute()
          .catch(() => ({ pathname: '/(tabs)/home' }) as const)
          .then((destination) => router.replace(destination));
      }}
    />
  );
}
