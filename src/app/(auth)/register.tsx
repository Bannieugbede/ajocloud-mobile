import { router } from 'expo-router';

import { DetailsStep } from '@/features/registration/details-step';
import { useRegistrationStore } from '@/store/registration-store';

export default function RegisterRoute() {
  const start = useRegistrationStore((state) => state.start);

  return (
    <DetailsStep
      onRegistered={(challenge) => {
        start(challenge.userId);
        router.replace({ pathname: '/(auth)/verify-email', params: challenge });
      }}
      onSignIn={() => router.replace('/(auth)/sign-in')}
    />
  );
}
