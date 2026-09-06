import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A titled group of rows or cards.
 *
 * Six screens had their own uppercase caption above a list, at two font sizes
 * and with different spacing above. The heading is announced as one, so a
 * screen reader can jump between sections instead of reading every row to find
 * where a group starts.
 */
export function AppSection({
  title,
  action,
  children,
  style,
  testID,
}: {
  title: string;
  /** A trailing control on the heading row, e.g. "See all". */
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, style]} testID={testID}>
      <View style={styles.header}>
        <AppText
          accessibilityRole="header"
          weight="semibold"
          style={[styles.title, { color: colors.textMuted }]}
        >
          {title}
        </AppText>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  title: { fontSize: fontSizes.caption, letterSpacing: 1 },
});
