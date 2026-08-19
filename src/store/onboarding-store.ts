import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type OnboardingState = {
  /** True once the carousel has been completed or skipped on this install. */
  completed: boolean;
  complete: () => void;
  /** Signing out returns the app to the introduction on next launch. */
  reset: () => void;
};

/**
 * Durable first-run preference. AsyncStorage is correct here rather than
 * SecureStore: this is a non-sensitive UI flag, not a credential.
 */
export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      complete: () => set({ completed: true }),
      reset: () => set({ completed: false }),
    }),
    {
      name: 'ajo-cloud-onboarding',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ completed }) => ({ completed }),
    },
  ),
);
