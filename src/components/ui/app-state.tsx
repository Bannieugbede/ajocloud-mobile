import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppButton } from './app-button';
import { AppText } from './app-text';

/**
 * The three non-content states every product list repeats. They live together
 * because they are mutually exclusive branches of the same decision, and keeping
 * them in one file makes it obvious that a screen must handle all three.
 */

export function AppLoadingState({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.centered}>
      <ActivityIndicator accessibilityLabel={label} color={colors.primary} />
    </View>
  );
}

/**
 * The tone an empty state is drawn in.
 *
 * Empty is not one situation. A list nobody has added to yet is an invitation
 * and should look like one; a filter that matched nothing is a dead end the
 * member can back out of; a section that is empty because everything is done is
 * good news. Drawing all three as the same grey box made every one of them read
 * as a failure.
 */
export type EmptyTone = 'invite' | 'neutral' | 'positive';

export function AppEmptyState({
  title,
  description,
  icon = 'file-tray-outline',
  tone = 'invite',
  action,
  onAction,
  secondaryAction,
  onSecondaryAction,
  compact = false,
  testID,
}: {
  title: string;
  description: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  tone?: EmptyTone;
  action?: string;
  onAction?: () => void;
  /** A second, quieter way out — "Clear filters" beside "Create a group". */
  secondaryAction?: string;
  onSecondaryAction?: () => void;
  /** Less vertical space, for an empty section inside a populated screen. */
  compact?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  const palette = {
    invite: { accent: colors.primary, medallion: colors.primarySoft },
    neutral: { accent: colors.textMuted, medallion: colors.surfaceMuted },
    positive: { accent: colors.success, medallion: colors.successSoft },
  }[tone];

  return (
    <View
      style={[
        styles.panel,
        compact ? styles.panelCompact : null,
        { backgroundColor: colors.cardBackground, borderColor: colors.border },
      ]}
      testID={testID}
    >
      {/* A tinted medallion rather than a bare glyph: at 28px on a flat panel
          the icon read as a broken image more than as an illustration. */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.medallion,
          compact ? styles.medallionCompact : null,
          { backgroundColor: palette.medallion },
        ]}
      >
        <Ionicons name={icon} size={compact ? 22 : 30} color={palette.accent} />
      </View>

      <View style={styles.copy}>
        <AppText weight="bold" style={compact ? styles.titleCompact : styles.title}>
          {title}
        </AppText>
        <AppText style={[styles.description, { color: colors.textMuted }]}>{description}</AppText>
      </View>

      {action && onAction ? (
        <View style={styles.actions}>
          {/* Primary, not outline. The whole point of an empty state with an
              action is that taking it is the obvious next thing to do. */}
          <AppButton label={action} onPress={onAction} style={styles.action} />
          {secondaryAction && onSecondaryAction ? (
            <AppButton
              label={secondaryAction}
              variant="ghost"
              onPress={onSecondaryAction}
              style={styles.action}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export function AppErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  testID,
}: {
  title?: string;
  description: string;
  onRetry: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.panel, { backgroundColor: colors.errorSoft, borderColor: colors.errorSoft }]}
      testID={testID}
      accessibilityLiveRegion="polite"
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[styles.medallion, { backgroundColor: colors.cardBackground }]}
      >
        <Ionicons name="alert-circle-outline" size={30} color={colors.error} />
      </View>

      <View style={styles.copy}>
        <AppText weight="bold" style={[styles.title, { color: colors.error }]}>
          {title}
        </AppText>
        <AppText style={[styles.description, { color: colors.textMuted }]}>{description}</AppText>
      </View>

      <View style={styles.actions}>
        <AppButton label="Try again" variant="outline" onPress={onRetry} style={styles.action} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { padding: spacing.lg },
  panel: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  panelCompact: { gap: spacing.sm, paddingVertical: spacing.lg },

  medallion: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  medallionCompact: { height: 48, width: 48 },

  copy: { gap: spacing.xs },
  title: { fontSize: fontSizes.title, textAlign: 'center' },
  titleCompact: { fontSize: fontSizes.body, textAlign: 'center' },
  description: { textAlign: 'center' },

  actions: { alignSelf: 'stretch', gap: spacing.xs },
  action: { alignSelf: 'stretch' },
});
