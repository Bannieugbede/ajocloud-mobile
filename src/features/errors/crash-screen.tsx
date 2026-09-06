import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { fontSizes, radius, sizes, spacing, themes, type ThemeTokens } from '@/theme';

import { supportMailto } from './crash-report';

/**
 * What the app shows when a render throws.
 *
 * Deliberately standalone. This renders above the theme provider, the query
 * client and the navigator, because any of those may be what failed — so it
 * reads the colour scheme straight from the system rather than from the store,
 * uses no navigation, and imports nothing that could throw on the way in. A
 * crash screen that can itself crash leaves a white rectangle and no way out.
 *
 * It never shows the error. A stack trace can carry whatever the code was
 * holding when it failed, and this is the one screen guaranteed to be seen by
 * someone who cannot be asked for consent first.
 */
export function CrashScreen({
  reference,
  onRetry,
  onReload,
  canReload,
  testID,
}: {
  /** The short quotable code; see `crash-report.ts`. */
  reference: string;
  onRetry: () => void;
  onReload: () => void;
  /** False until retrying in place has already been tried and failed. */
  canReload: boolean;
  testID?: string;
}) {
  const scheme = useColorScheme();
  const colors = themes[scheme === 'dark' ? 'dark' : 'light'];
  const mailto = supportMailto(reference);

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.screen, { backgroundColor: colors.background }]}
      testID={testID}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.medallion, { backgroundColor: colors.errorSoft }]}>
          <Ionicons name="warning-outline" size={34} color={colors.error} />
        </View>

        <View style={styles.copy}>
          <AppText accessibilityRole="header" weight="bold" style={styles.title}>
            Something went wrong
          </AppText>
          <AppText style={[styles.description, { color: colors.textMuted }]}>
            {/* Said explicitly. Someone whose banking app has just broken in
                front of them will assume the worst about their money first. */}
            The app ran into a problem and had to stop what it was doing. Your money and your
            savings are safe — nothing was changed.
          </AppText>
        </View>

        <View style={styles.actions}>
          <CrashButton label="Try again" onPress={onRetry} colors={colors} primary />
          {canReload ? (
            <CrashButton label="Restart the app" onPress={onReload} colors={colors} />
          ) : null}
          {mailto ? (
            <CrashButton
              label="Contact support"
              onPress={() => {
                // Failure here is ignored on purpose: a device with no mail
                // client must not throw inside the screen handling a crash.
                void Linking.openURL(mailto).catch(() => undefined);
              }}
              colors={colors}
              quiet
            />
          ) : null}
        </View>

        <View style={[styles.reference, { backgroundColor: colors.surfaceMuted }]}>
          <AppText style={[styles.referenceLabel, { color: colors.textMuted }]}>Reference</AppText>
          <AppText weight="semibold" style={styles.referenceCode}>
            {reference}
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * A local button rather than AppButton.
 *
 * AppButton reads the theme through the store, which is one of the things that
 * may have failed. Nothing on this screen depends on anything that could have
 * caused the crash it is reporting.
 */
function CrashButton({
  label,
  onPress,
  colors,
  primary = false,
  quiet = false,
}: {
  label: string;
  onPress: () => void;
  colors: ThemeTokens;
  primary?: boolean;
  quiet?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? colors.primary : 'transparent',
          borderColor: quiet ? 'transparent' : primary ? colors.primary : colors.borderStrong,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <AppText weight="semibold" style={{ color: primary ? colors.textInverse : colors.text }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    alignItems: 'center',
    flexGrow: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  medallion: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  copy: { gap: spacing.sm },
  title: { fontSize: fontSizes.heading, textAlign: 'center' },
  description: { textAlign: 'center' },

  actions: { alignSelf: 'stretch', gap: spacing.sm },
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
  },

  reference: {
    alignItems: 'center',
    borderRadius: radius.md,
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  referenceLabel: { fontSize: fontSizes.caption, letterSpacing: 1 },
  referenceCode: { fontSize: fontSizes.body, letterSpacing: 1.5 },
});
