import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { FoodProgramme } from '@/api/endpoints/food-ajo';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
export function FoodListScreen({
  programmes,
  loading,
  error,
  onRetry,
  onOpen,
}: {
  programmes?: FoodProgramme[];
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
      {loading ? (
        <ActivityIndicator
          accessibilityLabel="Loading Food Ajo programmes"
          color={colors.primary}
        />
      ) : null}
      {error ? (
        <View style={[styles.card, { backgroundColor: colors.errorSoft }]}>
          <AppText style={{ color: colors.error }}>Could not load Food Ajo.</AppText>
          <AppButton label="Try again" variant="outline" onPress={onRetry} />
        </View>
      ) : null}
      {!loading && !error && !programmes?.length ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <AppText weight="semibold">No programmes available</AppText>
          <AppText style={{ color: colors.textMuted }}>
            Approved coordinator programmes will appear here.
          </AppText>
        </View>
      ) : null}
      {programmes?.map((programme) => (
        <Pressable
          key={programme.id}
          accessibilityRole="button"
          accessibilityLabel={`Open ${programme.name}`}
          onPress={() => onOpen(programme.id)}
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <AppText weight="semibold" style={styles.name}>
              {programme.name}
            </AppText>
            <AppText weight="semibold" style={{ color: colors.primary }}>
              {programme.status}
            </AppText>
          </View>
          <AppText style={{ color: colors.textMuted }}>
            {programme._count.subscriptions}/{programme.enrolmentCapacity} joined ·{' '}
            {programme.fulfilmentMethod.toLowerCase().replaceAll('_', ' ')}
          </AppText>
          <View style={styles.row}>
            <AppText>{formatMinorAmount(programme.contributionMinor, programme.currency)}</AppText>
            <AppText style={{ color: colors.textMuted }}>
              {programme.contributionFrequency.toLowerCase()}
            </AppText>
          </View>
          <AppText style={{ color: colors.secondary }}>
            {programme.packages.length} package option(s)
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  name: { flex: 1, fontSize: fontSizes.body },
});
