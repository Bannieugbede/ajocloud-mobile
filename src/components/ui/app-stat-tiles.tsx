import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * A row of two or three headline counts.
 *
 * Each tile is one accessible element reading "4, Paid" rather than two stray
 * fragments, because a screen reader landing on a bare "4" between two other
 * bare numbers conveys nothing. Tones are advisory only: every tile also carries
 * its label as text, so status is never left to colour.
 */

export type StatTone = 'default' | 'success' | 'warning' | 'info';

export type Stat = {
  label: string;
  value: string;
  tone?: StatTone;
};

export function AppStatTiles({
  stats,
  columns,
  align = 'center',
  testID,
}: {
  stats: readonly Stat[];
  /**
   * Wraps into rows of this many instead of one row of everything. Four facts
   * across a phone leaves each tile too narrow to read, so a detail screen
   * shows them two by two.
   */
  columns?: 2;
  /**
   * `start` puts the label above the value and aligns both left, which reads
   * better when the values are long — a price and a date rather than a count.
   */
  align?: 'center' | 'start';
  testID?: string;
}) {
  const { colors } = useTheme();

  const toneColor = (tone: StatTone | undefined) =>
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'info'
          ? colors.info
          : colors.text;

  const wrapped = columns === 2;
  const leading = align === 'start';

  return (
    <View style={[styles.row, wrapped && styles.wrap]} testID={testID}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          accessible
          accessibilityLabel={`${stat.value} ${stat.label}`}
          style={[
            styles.tile,
            wrapped && styles.tileHalf,
            leading && styles.tileLeading,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {leading ? (
            <>
              <AppText numberOfLines={1} style={[styles.label, { color: colors.textMuted }]}>
                {stat.label}
              </AppText>
              <AppText
                weight="bold"
                numberOfLines={1}
                style={[styles.leadingValue, { color: toneColor(stat.tone) }]}
              >
                {stat.value}
              </AppText>
            </>
          ) : (
            <>
              <AppText
                weight="bold"
                numberOfLines={1}
                style={[styles.value, { color: toneColor(stat.tone) }]}
              >
                {stat.value}
              </AppText>
              <AppText numberOfLines={1} style={[styles.label, { color: colors.textMuted }]}>
                {stat.label}
              </AppText>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  wrap: { flexWrap: 'wrap' },
  // A wrapped tile is sized by basis rather than flex so two sit per row with
  // the gap between them, instead of four squeezing onto one line.
  tileHalf: { flexBasis: '47%', flexGrow: 1 },
  tileLeading: { alignItems: 'flex-start' },
  tile: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  value: { fontSize: fontSizes.title },
  leadingValue: { fontSize: fontSizes.body },
  label: { fontSize: fontSizes.caption },
});
