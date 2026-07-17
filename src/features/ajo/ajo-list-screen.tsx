import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

export function AjoListScreen({
  groups,
  loading,
  error,
  onRetry,
  onOpen,
}: {
  groups?: AjoGroupSummary[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onOpen: (id: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View>
        <AppText accessibilityRole="header" weight="bold" style={styles.title}>
          My Ajo Groups
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          Track contributions, membership, and group schedules.
        </AppText>
      </View>
      <View style={[styles.joinCard, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="key-outline" size={22} color={colors.primary} />
        <View style={styles.flex}>
          <AppText weight="semibold">Join via referral code</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Code lookup is awaiting its backend contract.
          </AppText>
        </View>
      </View>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading Ajo groups" color={colors.primary} />
      ) : null}
      {error ? (
        <View style={[styles.card, { backgroundColor: colors.errorSoft }]}>
          <AppText style={{ color: colors.error }}>Could not load your groups.</AppText>
          <AppButton label="Try again" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
      {!loading && !error && !groups?.length ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <AppText weight="semibold">No Ajo groups yet</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Groups you create or join will appear here.
          </AppText>
        </View>
      ) : null}
      {groups?.map((group) => (
        <Pressable
          key={group.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${group.name}`}
          onPress={() => onOpen(group.id)}
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <AppText weight="semibold" style={styles.name}>
              {group.name}
            </AppText>
            <AppText weight="semibold" style={{ color: colors.primary }}>
              {group.status}
            </AppText>
          </View>
          <AppText style={{ color: colors.textMuted }}>
            {group._count.members} members · {group._count.slots}/{group.maxSlots} slots
          </AppText>
          <View style={styles.row}>
            <AppText>{formatMinorAmount(group.baseContributionMinor, group.currency)}</AppText>
            <AppText style={{ color: colors.textMuted }}>
              {group.contributionFrequency.toLowerCase()}
            </AppText>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { fontSize: fontSizes.heading },
  joinCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  flex: { flex: 1, gap: spacing.xs },
  card: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  name: { flex: 1, fontSize: fontSizes.body },
});
