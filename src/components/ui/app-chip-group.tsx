import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A row of short, mutually exclusive choices.
 *
 * For options a member picks from a handful of known values — a duration, a
 * grace period — where a dropdown would hide the range and a text field would
 * invite an invalid answer. Wraps rather than scrolls by default, so nothing
 * is hidden off the edge of a narrow phone.
 */

export type ChipOption<T extends string | number> = {
  value: T;
  label: string;
};

/** Makes up the difference between the drawn chip and a 48dp touch target. */
const CHIP_HIT_SLOP = { bottom: 4, left: 2, right: 2, top: 4 };

export function AppChipGroup<T extends string | number>({
  label,
  hint,
  options,
  value,
  onChange,
  tone = 'primary',
  scroll = false,
  testID,
}: {
  /** Announced as the group's name. Optional when a heading already names it. */
  label?: string;
  /** A line beneath the chips, for a limit or a consequence. */
  hint?: string;
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `warning` for a choice that carries a cost, like a grace period. */
  tone?: 'primary' | 'warning';
  /** Scrolls horizontally instead of wrapping, for many narrow options. */
  scroll?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  const accent = tone === 'warning' ? colors.warning : colors.primary;

  const chips = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={String(option.value)}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        onPress={() => onChange(option.value)}
        // Restores the 48dp target the shorter pill gives up. A 48-tall chip
        // would dominate a form that has two rows of them.
        hitSlop={CHIP_HIT_SLOP}
        style={({ pressed }) => [
          styles.chip,
          {
            backgroundColor: selected ? accent : colors.surfaceMuted,
            borderColor: selected ? accent : colors.border,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <AppText
          weight={selected ? 'semibold' : 'medium'}
          style={{ color: selected ? colors.textInverse : colors.text }}
        >
          {option.label}
        </AppText>
      </Pressable>
    );
  });

  return (
    <View style={styles.group} testID={testID}>
      {label ? (
        <AppText weight="semibold" style={[styles.label, { color: colors.textMuted }]}>
          {label}
        </AppText>
      ) : null}
      {scroll ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
          accessibilityRole="radiogroup"
        >
          {chips}
        </ScrollView>
      ) : (
        <View accessibilityRole="radiogroup" style={styles.wrap}>
          {chips}
        </View>
      )}
      {hint ? <AppText style={[styles.hint, { color: colors.textMuted }]}>{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { fontSize: fontSizes.caption, letterSpacing: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    minWidth: 56,
    paddingHorizontal: spacing.md,
  },
  hint: { fontSize: fontSizes.caption },
});
