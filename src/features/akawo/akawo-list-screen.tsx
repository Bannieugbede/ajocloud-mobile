import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { AkawoGoal } from '@/api/endpoints/akawo';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
export function AkawoListScreen({
  goals,
  loading,
  onOpen,
}: {
  goals?: AkawoGoal[];
  loading: boolean;
  onOpen: (id: string) => void;
}) {
  const { colors } = useTheme();
  const total = goals?.reduce((sum, goal) => sum + BigInt(goal.savedMinor), 0n) ?? 0n;
  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <AppText style={{ color: colors.textInverse }}>TOTAL SAVED</AppText>
        <AppText weight="bold" style={[styles.title, { color: colors.textInverse }]}>
          {formatMinorAmount(total.toString())}
        </AppText>
        <AppText style={{ color: colors.textInverse }}>{goals?.length ?? 0} goals</AppText>
      </View>
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading Akawo goals" color={colors.primary} />
      ) : null}
      {!loading && !goals?.length ? (
        <View style={[styles.card, { borderColor: colors.border }]}>
          <AppText weight="semibold">No Akawo goals yet</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Create-goal form is the next step in this phase.
          </AppText>
        </View>
      ) : null}
      {goals?.map((goal) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${goal.name}`}
          onPress={() => onOpen(goal.id)}
          key={goal.id}
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <AppText weight="semibold">{goal.name}</AppText>
            <AppText style={{ color: colors.primary }}>
              {goal.progressBps === null ? 'Flexible' : `${Math.round(goal.progressBps / 100)}%`}
            </AppText>
          </View>
          <AppText>
            {formatMinorAmount(goal.savedMinor, goal.currency)} of{' '}
            {goal.targetMinor === '0'
              ? 'flexible target'
              : formatMinorAmount(goal.targetMinor, goal.currency)}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            {goal.type.toLowerCase()} · {goal.status.toLowerCase()}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg },
  hero: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  title: { fontSize: fontSizes.heading },
  card: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
