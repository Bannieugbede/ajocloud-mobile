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

export function AppStatTiles({ stats, testID }: { stats: readonly Stat[]; testID?: string }) {
  const { colors } = useTheme();

  const toneColor = (tone: StatTone | undefined) =>
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'info'
          ? colors.info
          : colors.text;

  return (
    <View style={styles.row} testID={testID}>
      {stats.map((stat) => (
        <View
          key={stat.label}
          accessible
          accessibilityLabel={`${stat.value} ${stat.label}`}
          style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
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
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
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
  label: { fontSize: fontSizes.caption },
});
