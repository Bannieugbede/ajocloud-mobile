import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { RegistrationStep } from '@/features/registration/steps';

type RegistrationState = {
  /** Where the user left off, so a relaunch resumes rather than restarts. */
  step: RegistrationStep | null;
  /** Set once the account exists, so verification can be resumed after sign-in. */
  userId: string | null;
  /** Whether the account still owes email verification. */
  emailVerified: boolean;
  /** Whether a transaction PIN has been set on this account. */
  pinSet: boolean;
  start: (userId: string) => void;
  goTo: (step: RegistrationStep) => void;
  markEmailVerified: () => void;
  markPinSet: () => void;
  finish: () => void;
};

/**
 * Durable progress through account creation. Nothing sensitive is kept here:
 * the PIN itself is never stored on the device, only the fact that one exists.
 * AsyncStorage is therefore correct; SecureStore is reserved for credentials.
 */
export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      step: null,
      userId: null,
      emailVerified: false,
      pinSet: false,
      start: (userId) => set({ userId, step: 'verify-email', emailVerified: false, pinSet: false }),
      goTo: (step) => set({ step }),
      markEmailVerified: () => set({ emailVerified: true, step: 'create-pin' }),
      markPinSet: () => set({ pinSet: true }),
      finish: () => set({ step: null, userId: null }),
    }),
    {
      name: 'ajo-cloud-registration',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ step, userId, emailVerified, pinSet }) => ({
        step,
        userId,
        emailVerified,
        pinSet,
      }),
    },
  ),
);
