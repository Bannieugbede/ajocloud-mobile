import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A number chosen by nudging rather than typing.
 *
 * For a count with a small sensible range and a meaningful default, where a
 * keyboard is more work than the choice deserves. The value is announced with
 * its unit so a screen reader says "20 members" rather than "20".
 */
export function AppStepper({
  label,
  value,
  unit,
  hint,
  onDecrement,
  onIncrement,
  canDecrement = true,
  canIncrement = true,
  testID,
}: {
  /** Announced as the control's name, e.g. "Maximum members". */
  label: string;
  value: string;
  /** The word beneath the number, e.g. "members". */
  unit: string;
  hint?: string;
  onDecrement: () => void;
  onIncrement: () => void;
  canDecrement?: boolean;
  canIncrement?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper} testID={testID}>
      <View
        accessible
        accessibilityLabel={`${label}, ${value} ${unit}`}
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <StepButton
          icon="remove"
          label={`Fewer ${unit}`}
          onPress={onDecrement}
          disabled={!canDecrement}
          filled={false}
        />
        <View style={styles.readout}>
          <AppText weight="bold" style={styles.value}>
            {value}
          </AppText>
          <AppText style={[styles.unit, { color: colors.textMuted }]}>{unit}</AppText>
        </View>
        <StepButton
          icon="add"
          label={`More ${unit}`}
          onPress={onIncrement}
          disabled={!canIncrement}
          filled
        />
      </View>
      {hint ? <AppText style={[styles.hint, { color: colors.textMuted }]}>{hint}</AppText> : null}
    </View>
  );
}

function StepButton({
  icon,
  label,
  onPress,
  disabled,
  filled,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  disabled: boolean;
  filled: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: filled ? colors.primary : colors.surfaceMuted,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={22} color={filled ? colors.textInverse : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  readout: { alignItems: 'center', flex: 1, gap: 2 },
  value: { fontSize: fontSizes.heading },
  unit: { fontSize: fontSizes.caption },
  button: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: sizes.touchTarget,
    justifyContent: 'center',
    width: sizes.touchTarget,
  },
  hint: { fontSize: fontSizes.caption },
});
