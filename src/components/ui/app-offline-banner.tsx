import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * Announces lost connectivity. Money actions must never be presented as complete
 * while offline, so this banner exists to make the state unmistakable before a
 * member attempts a contribution or withdrawal.
 */
export function AppOfflineBanner({ testID }: { testID?: string }) {
  const { colors } = useTheme();
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[styles.banner, { backgroundColor: colors.warningSoft }]}
      testID={testID}
    >
      <Ionicons
        name="cloud-offline-outline"
        size={16}
        color={colors.warning}
        accessibilityElementsHidden
        importantForAccessibility="no"
      />
      <AppText weight="medium" style={[styles.text, { color: colors.text }]}>
        You are offline. Payments and approvals are unavailable.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { flex: 1, fontSize: fontSizes.caption },
});
