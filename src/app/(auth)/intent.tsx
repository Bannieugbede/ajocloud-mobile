import { router } from 'expo-router';

import { IntentStep } from '@/features/registration/intent-step';
import { useRegistrationStore } from '@/store/registration-store';

export default function IntentRoute() {
  const finish = useRegistrationStore((state) => state.finish);

  return (
    <IntentStep
      onContinue={() => {
        finish();
        router.replace('/(tabs)/home');
      }}
    />
  );
}
