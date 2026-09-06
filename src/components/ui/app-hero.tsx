import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { AppAmount } from './app-amount';
import { AppText } from './app-text';

/**
 * The brand-coloured panel a detail screen opens with.
 *
 * Six screens had grown their own version of this, each with slightly different
 * padding, label casing and opacity on the secondary text. The figure at the top
 * of a screen is the one people read first, so it is worth it looking the same
 * everywhere.
 *
 * Text colours are fixed white-on-brand rather than theme tokens: the surface is
 * the brand fill in both themes, and `colors.text` would fail contrast on it in
 * light mode.
 */

const ON_HERO_TEXT = 'rgba(255, 255, 255, 0.82)';
const ON_HERO_TRACK = 'rgba(255, 255, 255, 0.24)';

export function AppHero({
  label,
  amountMinor,
  currency,
  caption,
  meta,
  progressBps,
  progressLabel,
  footer,
  children,
  style,
  testID,
}: {
  /** The small heading above the figure, e.g. "TOTAL COLLECTED". */
  label: string;
  /** The headline figure. Omit for a hero that leads with `caption` instead. */
  amountMinor?: string;
  currency?: string;
  /** A large non-money headline, used when `amountMinor` is absent. */
  caption?: string;
  /** A line under the figure — a target, a deadline, a frequency. */
  meta?: string;
  /** Draws a progress bar when supplied. */
  progressBps?: number;
  /** Accessible name for the bar. Required whenever `progressBps` is set. */
  progressLabel?: string;
  /** A row beneath the bar, usually two short facts at either end. */
  footer?: readonly [string, string];
  /** Anything else the hero needs, e.g. an action or a code row. */
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const percent =
    progressBps === undefined ? null : Math.max(0, Math.min(100, Math.round(progressBps / 100)));

  return (
    <View style={[styles.hero, { backgroundColor: colors.primary }, style]} testID={testID}>
      <AppText style={styles.label}>{label}</AppText>

      {amountMinor !== undefined ? (
        <AppAmount amountMinor={amountMinor} currency={currency} size="heading" onInverse />
      ) : null}
      {caption ? (
        <AppText weight="bold" style={styles.caption}>
          {caption}
        </AppText>
      ) : null}

      {meta ? <AppText style={styles.meta}>{meta}</AppText> : null}

      {percent !== null ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={progressLabel}
          accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent} percent` }}
          style={[styles.track, { backgroundColor: ON_HERO_TRACK }]}
        >
          <View
            style={[styles.fill, { backgroundColor: colors.textInverse, width: `${percent}%` }]}
          />
        </View>
      ) : null}

      {footer ? (
        <View style={styles.footer}>
          <AppText style={styles.meta}>{footer[0]}</AppText>
          <AppText style={styles.meta}>{footer[1]}</AppText>
        </View>
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  label: { color: ON_HERO_TEXT, fontSize: fontSizes.caption, letterSpacing: 1.1 },
  caption: { color: '#FFFFFF', fontSize: fontSizes.title },
  meta: { color: ON_HERO_TEXT, fontSize: fontSizes.caption },
  track: { borderRadius: radius.pill, height: 8, marginTop: spacing.xs, overflow: 'hidden' },
  fill: { borderRadius: radius.pill, height: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
});
