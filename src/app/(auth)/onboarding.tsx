import { router } from 'expo-router';

import { OnboardingScreen } from '@/features/onboarding/onboarding-screen';
import { useOnboardingStore } from '@/store/onboarding-store';

export default function OnboardingRoute() {
  const complete = useOnboardingStore((state) => state.complete);

  return (
    <OnboardingScreen
      onDone={() => {
        complete();
        router.replace('/(auth)/sign-in');
      }}
    />
  );
}
