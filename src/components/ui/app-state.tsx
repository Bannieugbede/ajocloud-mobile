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

export function AppEmptyState({
  title,
  description,
  icon = 'file-tray-outline',
  action,
  onAction,
  testID,
}: {
  title: string;
  description: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  action?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.panel, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      testID={testID}
    >
      <Ionicons
        name={icon}
        size={28}
        color={colors.textSubtle}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <AppText weight="semibold" style={styles.title}>
        {title}
      </AppText>
      <AppText style={[styles.description, { color: colors.textMuted }]}>{description}</AppText>
      {action && onAction ? (
        <AppButton label={action} variant="outline" onPress={onAction} style={styles.action} />
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
      <Ionicons
        name="alert-circle-outline"
        size={28}
        color={colors.error}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <AppText weight="semibold" style={[styles.title, { color: colors.error }]}>
        {title}
      </AppText>
      <AppText style={[styles.description, { color: colors.textMuted }]}>{description}</AppText>
      <AppButton label="Try again" variant="outline" onPress={onRetry} style={styles.action} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { padding: spacing.lg },
  panel: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  title: { fontSize: fontSizes.body, textAlign: 'center' },
  description: { textAlign: 'center' },
  action: { alignSelf: 'stretch', marginTop: spacing.sm },
});
