import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';

import { AppText } from './app-text';

/**
 * The two or three labelled facts across the middle of a list card.
 *
 * Every product's card had grown its own copy of this — Amount, Members, Due
 * Date — so it is one component. Unlike `AppStatTiles` these are not tiles: they
 * sit flat inside a card that already has its own surface, where a second
 * bordered box inside the first reads as clutter.
 */

export type Metric = {
  label: string;
  value: string;
};

export function AppMetricRow({ metrics, testID }: { metrics: readonly Metric[]; testID?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.row} testID={testID}>
      {metrics.map((metric) => (
        <View
          key={metric.label}
          accessible
          accessibilityLabel={`${metric.label}: ${metric.value}`}
          style={styles.metric}
        >
          <AppText style={[styles.label, { color: colors.textMuted }]}>{metric.label}</AppText>
          <AppText weight="bold" numberOfLines={1}>
            {metric.value}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  metric: { flex: 1, gap: 2 },
  label: { fontSize: fontSizes.caption },
});
