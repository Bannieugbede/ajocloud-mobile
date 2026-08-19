import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type BiometricState = {
  /** Whether the user opted into unlocking this install with biometrics. */
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

/**
 * A local preference only. Biometrics gate access to a session already stored
 * on this device; no biometric data is ever read, stored or transmitted, so
 * this flag carries nothing sensitive and belongs in AsyncStorage.
 */
export const useBiometricStore = create<BiometricState>()(
  persist(
    (set) => ({
      enabled: false,
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'ajo-cloud-biometrics',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ enabled }) => ({ enabled }),
    },
  ),
);
