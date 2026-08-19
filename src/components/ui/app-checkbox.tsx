import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';
import { radius, sizes, spacing } from '@/theme';

/**
 * A checkbox with its own hit area. The `checkbox` role plus `checked` state is
 * what tells a screen reader this is a toggle, so the visual tick is never the
 * only signal that it is on.
 */
export function AppCheckbox({
  checked,
  onChange,
  label,
  disabled,
  style,
  testID,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Accessible name. Required even when `children` renders the visible text. */
  label: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={[styles.row, style]}
      testID={testID}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: checked ? colors.primary : 'transparent',
            borderColor: checked ? colors.primary : colors.borderStrong,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color={colors.textInverse} /> : null}
      </View>
      {children ? <View style={styles.content}>{children}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    // Keeps the whole row a comfortable target rather than just the 22dp box.
    minHeight: sizes.touchTarget,
  },
  box: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  content: { flex: 1 },
});
