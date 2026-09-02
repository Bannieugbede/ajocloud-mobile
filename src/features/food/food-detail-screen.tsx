import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import type { FoodProgramme, FoodSubscription } from '@/api/endpoints/food-ajo';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';
import type { AppError } from '@/types/errors';
export function FoodDetailScreen({
  programme,
  subscription,
  loading,
  error,
  submitting,
  actionError,
  onRetry,
  onSubscribe,
  onUnsubscribe,
}: {
  programme?: FoodProgramme;
  /** The viewer's own enrolment in this programme, if any. */
  subscription?: FoodSubscription | null;
  loading: boolean;
  error: boolean;
  submitting?: boolean;
  actionError?: AppError | null;
  onRetry: () => void;
  onSubscribe: (packageId: string) => void;
  onUnsubscribe: () => void;
}) {
  const { colors } = useTheme();
  if (loading)
    return (
      <ActivityIndicator accessibilityLabel="Loading Food Ajo programme" color={colors.primary} />
    );
  if (error || !programme)
    return (
      <View style={styles.container}>
        <AppText style={{ color: colors.error }}>Could not load this programme.</AppText>
        <AppButton label="Try again" onPress={onRetry} />
      </View>
    );
  const spots = Math.max(0, programme.enrolmentCapacity - programme._count.subscriptions);
  const open = programme.status === 'OPEN';
  // A cancelled enrolment does not count: the member may join again.
  const enrolled =
    subscription != null && (subscription.status === 'PENDING' || subscription.status === 'ACTIVE');
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <AppText style={{ color: colors.textInverse }}>{programme.status} FOOD AJO</AppText>
        <AppText
          accessibilityRole="header"
          weight="bold"
          style={[styles.title, { color: colors.textInverse }]}
        >
          {programme.name}
        </AppText>
        <AppText style={{ color: colors.textInverse }}>
          {programme.fulfilmentMethod.toLowerCase().replaceAll('_', ' ')}
        </AppText>
      </View>
      <View style={styles.stats}>
        {[
          ['Contribution', formatMinorAmount(programme.contributionMinor, programme.currency)],
          ['Joined', `${programme._count.subscriptions}/${programme.enrolmentCapacity}`],
          ['Spots left', spots],
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
      {enrolled ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.successSoft, borderColor: colors.successSoft },
          ]}
        >
          <AppText weight="semibold">You have joined this programme</AppText>
          <AppText style={{ color: colors.textMuted }}>
            {subscription?.quantity ?? 1} portion{(subscription?.quantity ?? 1) === 1 ? '' : 's'} ·{' '}
            {statusLabel(subscription?.status ?? '')}
          </AppText>
          <AppButton
            label="Leave this programme"
            variant="outline"
            onPress={onUnsubscribe}
            loading={submitting ?? false}
            disabled={submitting ?? false}
          />
        </View>
      ) : null}

      {!open && !enrolled ? (
        <AppText style={{ color: colors.textMuted }}>
          {/* ACTIVE means buying has started, so a late joiner would not be in
              what was ordered. */}
          This programme is not taking new members.
        </AppText>
      ) : null}

      {actionError ? (
        <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
          {actionError.message}
        </AppText>
      ) : null}

      <AppText accessibilityRole="header" weight="semibold">
        Package options
      </AppText>
      {programme.packages.map((foodPackage) => (
        <View
          key={foodPackage.id}
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <View style={styles.row}>
            <AppText weight="semibold">{foodPackage.name}</AppText>
            <AppText weight="semibold" style={{ color: colors.primary }}>
              {formatMinorAmount(foodPackage.priceMinor, foodPackage.currency)}
            </AppText>
          </View>
          {foodPackage.items.map((item) => (
            <AppText key={item.id} style={{ color: colors.textMuted }}>
              ✓ {item.name} · {item.quantity} {item.unit}
            </AppText>
          ))}
          {open && !enrolled ? (
            <AppButton
              label={spots > 0 ? 'Join with this package' : 'Programme full'}
              onPress={() => onSubscribe(foodPackage.id)}
              loading={submitting ?? false}
              disabled={(submitting ?? false) || spots <= 0}
            />
          ) : null}
          <AppText style={{ color: foodPackage.priceLockedAt ? colors.success : colors.warning }}>
            {foodPackage.priceLockedAt ? 'Price locked' : 'Price not yet locked'}
          </AppText>
        </View>
      ))}
      <View style={[styles.card, { backgroundColor: colors.warningSoft }]}>
        <AppText weight="semibold">Enrollment not open in mobile yet</AppText>
        <AppText style={{ color: colors.textMuted }}>
          Subscription, contribution, fee, and price-lock contracts must be completed before this
          action can safely accept money.
        </AppText>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg },
  hero: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  title: { fontSize: fontSizes.heading },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  card: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
