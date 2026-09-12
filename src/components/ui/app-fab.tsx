import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * The one action a tab exists to start, floating over its list.
 *
 * Extended rather than icon-only: a bare plus on a screen that already lists
 * things people can join does not say which of the two it does, and the label
 * is what makes it answerable without tapping it.
 *
 * It is positioned absolutely against the screen, not the scroll view, so it
 * stays put while the list moves underneath. The screen behind it is
 * responsible for padding its content past the button — a floating control that
 * covers the last row of a list is a control that hides the thing it is next
 * to.
 */
export function AppFab({
  label,
  icon = 'add',
  onPress,
  /** Clearance for whatever sits below, usually the tab bar. */
  bottomOffset,
  testID,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  bottomOffset: number;
  testID?: string;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: colors.primary,
          bottom: bottomOffset,
          opacity: pressed ? 0.85 : 1,
          shadowColor: colors.scrim,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.textInverse} />
      <AppText weight="semibold" style={[styles.label, { color: colors.textInverse }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    borderRadius: radius.pill,
    elevation: 6,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
    position: 'absolute',
    right: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  label: { fontSize: fontSizes.body },
});
