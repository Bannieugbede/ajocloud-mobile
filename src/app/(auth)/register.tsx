import { router } from 'expo-router';

import { RegisterScreen } from '@/features/auth/register-screen';

export default function RegisterRoute() {
  return (
    <RegisterScreen
      onRegistered={(challenge) =>
        router.replace({
          pathname: '/(auth)/verify-phone',
          params: challenge,
        })
      }
      onSignIn={() => router.replace('/(auth)/sign-in')}
    />
  );
}
