import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import {
  authenticateWithBiometrics,
  getBiometricAvailability,
  type BiometricAvailability,
} from '@/services/biometric-unlock';
import { useBiometricStore } from '@/store/biometric-store';
import { radius, spacing } from '@/theme';
import { StepScreen } from './step-screen';

export function BiometricsStep({ onDone }: { onDone: () => void }) {
  const { colors } = useTheme();
  const setEnabled = useBiometricStore((state) => state.setEnabled);
  const [availability, setAvailability] = useState<BiometricAvailability | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    void getBiometricAvailability().then((result) => {
      if (active) setAvailability(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    setError(undefined);
    try {
      // Confirm it actually works on this device before promising it will.
      const passed = await authenticateWithBiometrics('Enable quick sign-in for Ajo Cloud');
      if (!passed) {
        setError('We could not confirm that. You can turn this on later in your profile.');
        return;
      }
      setEnabled(true);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  const label = availability?.label ?? 'biometric unlock';
  const unsupported = availability !== null && !availability.available;

  return (
    <StepScreen
      step="biometrics"
      title={`Enable ${label}?`}
      description={
        unsupported
          ? 'This device has no biometrics set up, so you will sign in with your password. You can enable this later if that changes.'
          : `Sign in faster next time. ${capitalise(label)} only unlocks Ajo Cloud on this device — it never replaces your PIN for approving payments.`
      }
      error={error}
      footer={
        <AppButton
          label={unsupported ? 'Continue' : 'Maybe later'}
          variant="ghost"
          disabled={busy}
          onPress={onDone}
        />
      }
    >
      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Ionicons
            // Decorative: the heading already says what this offers.
            accessibilityElementsHidden
            importantForAccessibility="no"
            name={availability?.kind === 'face' ? 'scan-outline' : 'finger-print-outline'}
            size={48}
            color={colors.primary}
          />
        </View>
        <AppText style={[styles.note, { color: colors.textSubtle }]}>
          Ajo Cloud never sees or stores your biometric data. Your device confirms it is you and
          releases the session already saved here.
        </AppText>
        {!unsupported && (
          <AppButton
            label={`Enable ${label}`}
            loading={busy}
            disabled={availability === null}
            onPress={() => void enable()}
          />
        )}
      </View>
    </StepScreen>
  );
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 96,
    justifyContent: 'center',
    width: 96,
  },
  note: { lineHeight: 20 },
});
