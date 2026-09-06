import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A pill-track switch between views of the same record.
 *
 * Distinct from `AppChipGroup`, which picks a *value* inside a form: this picks
 * which *panel* is on screen, so it is announced as a tab list and the selected
 * segment is drawn as a raised surface on a sunken track rather than as a filled
 * brand pill. Using the chip group here would tell a screen reader a radio was
 * chosen when in fact the page changed.
 */

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

export function AppSegmented<T extends string>({
  options,
  value,
  onChange,
  label,
  testID,
}: {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Announced as the tab list's name, e.g. the record being viewed. */
  label?: string;
  testID?: string;
}) {
  const { colors } = useTheme();

  // Four segments no longer fit a narrow phone at a readable size, so the track
  // scrolls instead of squeezing the labels past legibility.
  const scroll = options.length > 3;

  const segments = options.map((option) => {
    const selected = option.value === value;
    return (
      <Pressable
        key={option.value}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={option.label}
        onPress={() => onChange(option.value)}
        style={({ pressed }) => [
          styles.segment,
          scroll ? styles.segmentAuto : styles.segmentEven,
          selected && {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          pressed && !selected && { opacity: 0.7 },
        ]}
      >
        <AppText
          weight={selected ? 'semibold' : 'medium'}
          numberOfLines={1}
          style={{ color: selected ? colors.text : colors.textMuted }}
        >
          {option.label}
        </AppText>
      </Pressable>
    );
  });

  const track = [styles.track, { backgroundColor: colors.surfaceMuted }];

  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityRole="tablist"
        accessibilityLabel={label}
        contentContainerStyle={track}
        style={styles.scroller}
        testID={testID}
      >
        {segments}
      </ScrollView>
    );
  }

  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={track} testID={testID}>
      {segments}
    </View>
  );
}

const styles = StyleSheet.create({
  scroller: { flexGrow: 0 },
  track: { borderRadius: radius.pill, flexDirection: 'row', gap: spacing.xs, padding: spacing.xs },
  segment: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  segmentEven: { flex: 1 },
  segmentAuto: { flexGrow: 0 },
});
