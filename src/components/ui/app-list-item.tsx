import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A settings/menu row. The chevron is decorative — the row's own button role
 * already tells a screen reader it is actionable — so it is kept out of the
 * accessibility tree rather than announced as a second control.
 */
export function AppListItem({
  title,
  description,
  icon,
  trailing,
  onPress,
  showChevron = true,
  destructive = false,
  card = false,
  centered = false,
  disabled,
  style,
  testID,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  trailing?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  /**
   * Draws the row as its own surface rather than a line in a shared list.
   * Separated rows are easier to hit and to scan on a settings menu, where
   * each entry goes somewhere different.
   */
  card?: boolean;
  /** Centres the label with no icon or chevron, for a standalone action. */
  centered?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const foreground = destructive ? colors.error : colors.text;
  const surface = card
    ? {
        backgroundColor: destructive ? colors.errorSoft : colors.surface,
        borderColor: destructive ? colors.error : colors.border,
        borderRadius: radius.lg,
        borderWidth: 1,
        paddingHorizontal: spacing.md,
      }
    : null;

  const content = (
    <>
      {icon ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[
            styles.icon,
            { backgroundColor: destructive ? colors.errorSoft : colors.primarySoft },
          ]}
        >
          <Ionicons name={icon} size={18} color={destructive ? colors.error : colors.primary} />
        </View>
      ) : null}
      <View style={[styles.text, centered ? styles.centeredText : null]}>
        <AppText weight={centered ? 'semibold' : 'medium'} style={{ color: foreground }}>
          {title}
        </AppText>
        {description ? (
          <AppText style={[styles.description, { color: colors.textMuted }]}>{description}</AppText>
        ) : null}
      </View>
      {trailing}
      {onPress && showChevron && !centered ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textSubtle}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, surface, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={description ? `${title}. ${description}` : title}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={(state) => [
        styles.row,
        surface,
        { opacity: disabled ? 0.5 : state.pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.sm,
  },
  icon: {
    alignItems: 'center',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  text: { flex: 1, gap: 2 },
  centeredText: { alignItems: 'center' },
  description: { fontSize: fontSizes.caption },
});
