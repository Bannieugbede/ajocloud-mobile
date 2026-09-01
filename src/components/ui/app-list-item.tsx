import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, sizes, spacing } from '@/theme';

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
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const foreground = destructive ? colors.error : colors.text;

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
      <View style={styles.text}>
        <AppText weight="medium" style={{ color: foreground }}>
          {title}
        </AppText>
        {description ? (
          <AppText style={[styles.description, { color: colors.textMuted }]}>{description}</AppText>
        ) : null}
      </View>
      {trailing}
      {onPress && showChevron ? (
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
      <View style={[styles.row, style]} testID={testID}>
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
      style={(state) => [styles.row, { opacity: disabled ? 0.5 : state.pressed ? 0.7 : 1 }, style]}
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
  description: { fontSize: fontSizes.caption },
});
