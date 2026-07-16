import { router, useLocalSearchParams } from 'expo-router';

import { IntroductionScreen } from '@/features/onboarding/introduction-screen';

export default function IntroductionRoute() {
  const { next } = useLocalSearchParams<{ next?: string }>();

  return (
    <IntroductionScreen
      onComplete={() => {
        if (next === 'register') router.replace('/(auth)/register');
        else if (next === 'sign-in') router.replace('/(auth)/sign-in');
        else router.back();
      }}
    />
  );
}
