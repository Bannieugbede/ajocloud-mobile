import { router } from 'expo-router';

import { BiometricsStep } from '@/features/registration/biometrics-step';

export default function BiometricsRoute() {
  return <BiometricsStep onDone={() => router.replace('/(auth)/verify-identity')} />;
}
