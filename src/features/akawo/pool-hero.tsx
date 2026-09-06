import { StyleSheet, View } from 'react-native';

import { AppAmount } from '@/components/ui/app-amount';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

/** Fill colour for the hero's own progress bar, which sits on the brand surface. */
const ON_HERO_TRACK = 'rgba(255, 255, 255, 0.24)';
const ON_HERO_TEXT = 'rgba(255, 255, 255, 0.82)';

/**
 * The collection banner at the top of a pool.
 *
 * Both the organiser's and the member's view open with the same fact — how much
 * of the target is in — so the surface is shared rather than reimplemented
 * either side, which is how the two drifted apart before.
 *
 * The progress bar is drawn here rather than reusing `AppProgress` because that
 * component's track and value colours are theme tokens chosen for a page
 * background; on the brand fill they fail contrast. The percentage is still
 * rendered as text beside it, so the bar is never the only way to read it.
 */
export function PoolHero({
  label,
  collectedMinor,
  targetMinor,
  currency,
  dueLabel,
  paidCount,
  memberCount,
  progressBps,
  testID,
}: {
  /** The heading above the amount, e.g. "TOTAL COLLECTED". */
  label: string;
  collectedMinor: string;
  /** The full expected amount. Omitted when nothing has been set to collect. */
  targetMinor?: string;
  currency: string;
  dueLabel?: string;
  paidCount: number;
  memberCount: number;
  progressBps: number;
  testID?: string;
}) {
  const { colors } = useTheme();
  const percent = Math.max(0, Math.min(100, Math.round(progressBps / 100)));

  const meta = [
    targetMinor ? `Target: ${formatMinorAmount(targetMinor, currency)}` : null,
    dueLabel ? `Due: ${dueLabel}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.hero, { backgroundColor: colors.primary }]} testID={testID}>
      <AppText style={styles.label}>{label}</AppText>
      <AppAmount amountMinor={collectedMinor} currency={currency} size="heading" onInverse />
      {meta ? <AppText style={styles.meta}>{meta}</AppText> : null}

      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Collection progress"
        accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent} percent` }}
        style={[styles.track, { backgroundColor: ON_HERO_TRACK }]}
      >
        <View
          style={[styles.fill, { backgroundColor: colors.textInverse, width: `${percent}%` }]}
        />
      </View>

      <View style={styles.footer}>
        <AppText style={styles.meta}>
          {paidCount}/{memberCount} members paid
        </AppText>
        <AppText style={styles.meta}>{percent}% of target</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  label: { color: ON_HERO_TEXT, fontSize: fontSizes.caption, letterSpacing: 1.1 },
  meta: { color: ON_HERO_TEXT, fontSize: fontSizes.caption },
  track: { borderRadius: radius.pill, height: 8, marginTop: spacing.xs, overflow: 'hidden' },
  fill: { borderRadius: radius.pill, height: '100%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
});
