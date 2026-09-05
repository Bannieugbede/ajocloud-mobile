import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type {
  FoodCoordinatorApplication,
  FoodProgramme,
  FoodSubscription,
} from '@/api/endpoints/food-ajo';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppProgress } from '@/components/ui/app-progress';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import {
  coordinatorInvitation,
  enrolmentProgressBps,
  fulfilmentLabel,
  placesLeft,
} from './programme-summary';

export type FoodListScreenProps = {
  programmes?: FoodProgramme[];
  subscriptions?: FoodSubscription[];
  applications?: FoodCoordinatorApplication[];
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onRetry: () => void;
  onOpen: (id: string) => void;
  onApplyAsCoordinator: () => void;
};

export function FoodListScreen(props: FoodListScreenProps) {
  const { colors } = useTheme();

  const joinedIds = new Set((props.subscriptions ?? []).map((entry) => entry.groupId));
  const browsable = (props.programmes ?? []).filter((programme) => !joinedIds.has(programme.id));
  const invitation = coordinatorInvitation(props.applications);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <View style={[styles.coordinator, { backgroundColor: colors.warningSoft }]}>
        <View style={[styles.coordinatorIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name="star-outline" size={20} color={colors.warning} />
        </View>
        <View style={styles.coordinatorText}>
          <AppText weight="semibold">{invitation.title}</AppText>
          <AppText style={{ color: colors.textMuted }}>{invitation.description}</AppText>
        </View>
        {invitation.canApply ? (
          <AppButton label="Apply" variant="outline" onPress={props.onApplyAsCoordinator} />
        ) : null}
      </View>

      {props.loading ? (
        <>
          <AppSkeletonCard testID="food-skeleton" />
          <AppSkeletonCard />
        </>
      ) : null}

      {props.error ? (
        <AppErrorState
          title="Could not load Food Ajo"
          description="Programmes could not be refreshed. Check your connection and try again."
          onRetry={props.onRetry}
        />
      ) : null}

      {props.subscriptions?.length ? (
        <View style={styles.section}>
          <AppText accessibilityRole="header" weight="semibold" style={styles.sectionTitle}>
            My Active Plans
          </AppText>
          {props.subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onPress={() => props.onOpen(subscription.groupId)}
            />
          ))}
        </View>
      ) : null}

      {!props.loading && !props.error && !props.programmes?.length ? (
        <AppEmptyState
          icon="basket-outline"
          title="No programmes available"
          description="Approved coordinator programmes will appear here."
        />
      ) : null}

      {browsable.length ? (
        <View style={styles.section}>
          <AppText accessibilityRole="header" weight="semibold" style={styles.sectionTitle}>
            Browse Packages
          </AppText>
          {browsable.map((programme) => (
            <ProgrammeCard
              key={programme.id}
              programme={programme}
              onPress={() => props.onOpen(programme.id)}
            />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

function SubscriptionCard({
  subscription,
  onPress,
}: {
  subscription: FoodSubscription;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const total = BigInt(subscription.package.priceMinor || '0') * BigInt(subscription.quantity || 1);

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Open ${subscription.group.name}, ${statusLabel(subscription.status)}`}
      style={styles.card}
    >
      <View style={styles.rowBetween}>
        <AppText weight="semibold" style={styles.name} numberOfLines={2}>
          {subscription.group.name}
        </AppText>
        <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
          <AppText weight="semibold" style={[styles.badgeText, { color: colors.success }]}>
            {statusLabel(subscription.status)}
          </AppText>
        </View>
      </View>
      <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
        {subscription.package.name}
        {subscription.quantity > 1 ? ` × ${subscription.quantity}` : ''} ·{' '}
        {formatMinorAmount(total.toString(), subscription.package.currency)}
      </AppText>
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
        {subscription.group.distributionAt
          ? `Distribution ${new Date(subscription.group.distributionAt).toLocaleDateString()}`
          : 'Distribution date to be confirmed'}
      </AppText>
    </AppCard>
  );
}

function ProgrammeCard({ programme, onPress }: { programme: FoodProgramme; onPress: () => void }) {
  const { colors } = useTheme();
  const left = placesLeft(programme);
  const cheapest = programme.packages
    .map((entry) => entry.priceMinor)
    .sort((a, b) => (BigInt(a || '0') < BigInt(b || '0') ? -1 : 1))[0];

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Open ${programme.name}, ${programme._count.subscriptions} of ${programme.enrolmentCapacity} joined`}
      style={styles.card}
    >
      <View style={styles.rowBetween}>
        <AppText weight="semibold" style={styles.name} numberOfLines={2}>
          {programme.name}
        </AppText>
        <AppText weight="semibold" style={{ color: colors.primary }}>
          {formatMinorAmount(cheapest ?? programme.contributionMinor, programme.currency)}
        </AppText>
      </View>

      <AppText style={{ color: colors.textMuted }} numberOfLines={2}>
        {programme.packages.length === 1
          ? programme.packages[0]?.name
          : `${programme.packages.length} package options`}{' '}
        · {fulfilmentLabel(programme.fulfilmentMethod)}
      </AppText>

      <AppProgress
        progressBps={enrolmentProgressBps(programme)}
        label={`${programme.name} enrolment`}
        showValue={false}
      />
      <View style={styles.rowBetween}>
        <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
          {programme._count.subscriptions}/{programme.enrolmentCapacity} joined
        </AppText>
        <AppText
          weight="semibold"
          style={{
            // A nearly-full programme is the one worth acting on, so it is
            // called out rather than left as one number among several.
            color: left <= 3 && left > 0 ? colors.warning : colors.textMuted,
            fontSize: fontSizes.caption,
          }}
        >
          {left > 0 ? `${left} ${left === 1 ? 'place' : 'places'} left` : 'Full'}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },

  coordinator: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  coordinatorIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  coordinatorText: { flex: 1, gap: 2 },

  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.body },

  card: { gap: spacing.sm },
  name: { flex: 1, fontSize: fontSizes.body },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: fontSizes.caption },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
