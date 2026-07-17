import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { AjoGroupDetail } from '@/api/endpoints/ajo-groups';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
export function AjoDetailScreen({
  group,
  loading,
  error,
  onRetry,
}: {
  group?: AjoGroupDetail;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  const { colors } = useTheme();
  if (loading)
    return <ActivityIndicator accessibilityLabel="Loading Ajo group" color={colors.primary} />;
  if (error || !group)
    return (
      <View style={styles.container}>
        <AppText style={{ color: colors.error }}>Could not load this Ajo group.</AppText>
        <AppButton label="Try again" onPress={onRetry} />
      </View>
    );
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View>
        <AppText accessibilityRole="header" weight="bold" style={styles.title}>
          {group.name}
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          {group.description ?? 'Community contribution group'}
        </AppText>
      </View>
      <View style={[styles.pool, { backgroundColor: colors.primary }]}>
        <AppText style={{ color: colors.textInverse }}>Contribution</AppText>
        <AppText weight="bold" style={[styles.amount, { color: colors.textInverse }]}>
          {formatMinorAmount(group.baseContributionMinor, group.currency)}
        </AppText>
        <AppText style={{ color: colors.textInverse }}>
          {group.contributionFrequency.toLowerCase()} · {group.status}
        </AppText>
      </View>
      <View style={styles.stats}>
        {[
          ['Members', group.members.length],
          ['Slots', group._count.slots],
          ['Capacity', group.maxSlots],
        ].map(([label, value]) => (
          <View
            key={String(label)}
            style={[
              styles.stat,
              { backgroundColor: colors.cardBackground, borderColor: colors.border },
            ]}
          >
            <AppText weight="bold">{value}</AppText>
            <AppText style={{ color: colors.textMuted }}>{label}</AppText>
          </View>
        ))}
      </View>
      <AppText accessibilityRole="header" weight="semibold">
        Members
      </AppText>
      {group.members.map((member) => (
        <View key={member.id} style={[styles.member, { borderColor: colors.border }]}>
          <AppText>{member.role === 'GROUP_ADMIN' ? 'Group administrator' : 'Member'}</AppText>
          <AppText style={{ color: colors.textMuted }}>
            {member._count.slots} slot(s) · {member.status}
          </AppText>
        </View>
      ))}
      <View style={[styles.member, { backgroundColor: colors.warningSoft }]}>
        <AppText weight="semibold">Contribution history and rotation</AppText>
        <AppText style={{ color: colors.textMuted }}>
          These sections unlock when schedule and collection APIs expose member-safe data.
        </AppText>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg },
  title: { fontSize: fontSizes.heading },
  pool: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  amount: { fontSize: fontSizes.heading },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  member: { borderBottomWidth: 1, gap: spacing.xs, padding: spacing.md },
});
