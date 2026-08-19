import { Redirect, router } from 'expo-router';

import { clearPendingPin, takePendingPin } from '@/features/registration/pending-pin';
import { ConfirmPinStep } from '@/features/registration/pin-steps';
import { useRegistrationStore } from '@/store/registration-store';

export default function ConfirmPinRoute() {
  const markPinSet = useRegistrationStore((state) => state.markPinSet);
  const chosenPin = takePendingPin();

  // Reached directly (deep link, or a relaunch that dropped the in-memory PIN):
  // there is nothing to confirm, so start the pair again.
  if (!chosenPin) return <Redirect href="/(auth)/create-pin" />;

  return (
    <ConfirmPinStep
      chosenPin={chosenPin}
      onConfirmed={() => {
        clearPendingPin();
        markPinSet();
        router.replace('/(auth)/biometrics');
      }}
      onRestart={() => {
        clearPendingPin();
        router.replace('/(auth)/create-pin');
      }}
    />
  );
}
