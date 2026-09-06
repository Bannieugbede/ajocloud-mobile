import { ScrollView, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { chargesAnything, feeAmountLabel, FEE_LINES } from './platform-fees';

/**
 * What Ajo Cloud charges, in one place a member can check before committing
 * money. The figures come from `platform-fees.ts` rather than being written
 * here, so the screen cannot disagree with itself or with a later rate change.
 */
export function PlatformFeesScreen() {
  const { colors } = useTheme();
  const charges = chargesAnything();

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.summary, { backgroundColor: colors.primarySoft }]}>
        <AppText accessibilityRole="header" weight="bold" style={styles.summaryTitle}>
          {charges ? 'What we charge' : 'Ajo Cloud is free to use'}
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          {charges
            ? 'These are the charges that apply to your account.'
            : 'We do not add a fee to contributions, savings, food packages or bills. If that ever changes, it will be shown here first.'}
        </AppText>
      </View>

      {FEE_LINES.map((line) => (
        <AppCard key={`${line.product}:${line.name}`} style={styles.card}>
          <View style={styles.row}>
            <View style={styles.text}>
              <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
                {line.product}
              </AppText>
              <AppText weight="semibold">{line.name}</AppText>
            </View>
            <View
              style={[
                styles.pill,
                { backgroundColor: line.amount ? colors.warningSoft : colors.successSoft },
              ]}
            >
              <AppText
                weight="semibold"
                style={[styles.pillText, { color: line.amount ? colors.warning : colors.success }]}
              >
                {feeAmountLabel(line)}
              </AppText>
            </View>
          </View>
          <AppText style={{ color: colors.textMuted }}>{line.detail}</AppText>
        </AppCard>
      ))}

      <AppText style={[styles.footnote, { color: colors.textMuted }]}>
        {/* Said plainly: a member who is charged by their own bank should not
            think Ajo Cloud took it. */}
        Your bank or mobile provider may charge you separately for a transfer or for data. Those
        charges are theirs, not ours.
      </AppText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  summary: { borderRadius: radius.lg, gap: spacing.xs, padding: spacing.lg },
  summaryTitle: { fontSize: fontSizes.title },
  card: { gap: spacing.sm },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  text: { flex: 1, gap: 2 },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  pillText: { fontSize: fontSizes.caption },
  footnote: { fontSize: fontSizes.caption },
});
