import { router } from 'expo-router';

import { setPendingPin } from '@/features/registration/pending-pin';
import { CreatePinStep } from '@/features/registration/pin-steps';

export default function CreatePinRoute() {
  return (
    <CreatePinStep
      onChosen={(pin) => {
        setPendingPin(pin);
        router.push('/(auth)/confirm-pin');
      }}
    />
  );
}
