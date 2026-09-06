import { Stack, router, useNavigation, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Logo } from '@/components/logo';
import { useTheme } from '@/hooks/use-theme';
import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';
import { sizes, spacing } from '@/theme';

/**
 * Where each auth screen goes back to.
 *
 * The step form advances with `router.replace`, so a step never leaves a stack
 * entry behind and `canGoBack()` is false almost everywhere. Back therefore has
 * to be declared rather than inferred: each screen names the step before it.
 *
 * A screen absent from this map has no way back — either it is the entry point
 * (`onboarding`, `sign-in`) or returning would be wrong. `create-pin` is the
 * first step after the account exists and its email is verified: neither can be
 * undone, so there is nothing behind it.
 */
const BACK_TARGETS: Record<string, Href> = {
  register: '/(auth)/sign-in',
  'verify-email': '/(auth)/register',
  'confirm-pin': '/(auth)/create-pin',
  biometrics: '/(auth)/confirm-pin',
  'verify-identity': '/(auth)/biometrics',
  'personal-details': '/(auth)/verify-identity',
  'identity-document': '/(auth)/personal-details',
  'bank-account': '/(auth)/identity-document',
  'forgot-password': '/(auth)/sign-in',
  'reset-password': '/(auth)/forgot-password',
};

/**
 * Prefers real stack history when there is any (`sign-in` → `forgot-password`
 * pushes), and otherwise falls back to the declared target so a replaced step
 * still has a working back control.
 */
function BackButton() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const pathname = usePathname();
  const target = BACK_TARGETS[pathname.split('/').pop() ?? ''];

  // Real history wins over the declared target, which matters most for the
  // identity screens: they are reached both as a registration step and from
  // Profile, and the declared target is only right for the first of those.
  if (!target) return navigation.canGoBack() ? <BackChevron colors={colors} /> : null;

  return (
    <BackChevron
      colors={colors}
      onPress={() => {
        if (navigation.canGoBack()) router.back();
        else router.replace(target);
      }}
    />
  );
}

function BackChevron({
  colors,
  onPress = () => router.back(),
}: {
  colors: ReturnType<typeof useTheme>['colors'];
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={spacing.sm}
      onPress={onPress}
      style={styles.back}
      testID="auth-back-button"
    >
      <Ionicons name="chevron-back" size={24} color={colors.text} />
    </Pressable>
  );
}

/**
 * The identity screens are reached two ways: as registration steps, and from
 * Profile's "KYC Verification" and "Bank Accounts" rows.
 *
 * The brand mark is right while someone is still creating an account — there is
 * no other context to give them. It is wrong once they are signed in and have
 * tapped a named row to get here: the header then says "Ajo Cloud" where it
 * should say what the screen is, which is the one thing the member needs it to
 * say. These name themselves instead.
 */
const NAMED_SCREENS: Record<string, string> = {
  'verify-identity': 'KYC Verification',
  'personal-details': 'Personal Details',
  'identity-document': 'Identity Document',
  'bank-account': 'Bank Account',
  'identity-complete': 'Verification Complete',
};

export default function AuthLayout() {
  const stackOptions = useThemedStackOptions();

  /** A screen that names itself, rather than showing the brand mark. */
  const named = (name: string) => ({
    title: NAMED_SCREENS[name],
    headerTitle: undefined,
    headerTitleAlign: 'left' as const,
  });

  return (
    <Stack
      screenOptions={{
        ...stackOptions,
        headerTitle: () => <Logo />,
        headerTitleAlign: 'center',
        headerLeft: () => <BackButton />,
        headerBackVisible: false,
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="create-pin" />
      <Stack.Screen name="confirm-pin" />
      <Stack.Screen name="biometrics" />
      <Stack.Screen name="verify-identity" options={named('verify-identity')} />
      <Stack.Screen name="personal-details" options={named('personal-details')} />
      <Stack.Screen name="identity-document" options={named('identity-document')} />
      <Stack.Screen name="bank-account" options={named('bank-account')} />
      <Stack.Screen name="identity-complete" options={named('identity-complete')} />
      <Stack.Screen name="intent" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  back: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
  },
});
