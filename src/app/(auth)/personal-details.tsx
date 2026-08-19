import { router } from 'expo-router';

import { PersonalDetailsStep } from '@/features/registration/personal-details-step';

export default function PersonalDetailsRoute() {
  return <PersonalDetailsStep onSaved={() => router.replace('/(auth)/identity-document')} />;
}
