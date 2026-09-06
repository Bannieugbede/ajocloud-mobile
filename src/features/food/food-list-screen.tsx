import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  FoodCoordinatorApplication,
  FoodProgramme,
  FoodSubscription,
} from '@/api/endpoints/food-ajo';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreenHeader } from '@/components/ui/app-screen-header';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppEmptyState, AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import { longDate } from '@/utils/dates';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import { coordinatorInvitation, fulfilmentLabel, placesLeft } from './programme-summary';

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
  const insets = useSafeAreaInsets();

  const joinedIds = new Set((props.subscriptions ?? []).map((entry) => entry.groupId));
  const browsable = (props.programmes ?? []).filter((programme) => !joinedIds.has(programme.id));
  const invitation = coordinatorInvitation(props.applications);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm },
      ]}
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        <RefreshControl
          refreshing={props.refreshing}
          onRefresh={props.onRefresh}
          tintColor={colors.primary}
          progressViewOffset={insets.top}
        />
      }
    >
      <AppScreenHeader title="Food Ajo" subtitle="Community bulk buying and distribution" />

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
          tone="neutral"
          title="No programmes yet"
          description="Food programmes near you will appear here once a coordinator opens one."
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
        <AppBadge label={statusLabel(subscription.status)} tone="success" />
      </View>
      <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
        {subscription.package.name}
        {subscription.quantity > 1 ? ` × ${subscription.quantity}` : ''} ·{' '}
        {formatMinorAmount(total.toString(), subscription.package.currency)}
      </AppText>
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
        {subscription.group.distributionAt
          ? `Distribution ${longDate(subscription.group.distributionAt)}`
          : 'Distribution date to be confirmed'}
      </AppText>
    </AppCard>
  );
}

function ProgrammeCard({ programme, onPress }: { programme: FoodProgramme; onPress: () => void }) {
  const { colors } = useTheme();
  const left = placesLeft(programme);
  const cheapest = [...programme.packages].sort((a, b) =>
    BigInt(a.priceMinor || '0') < BigInt(b.priceMinor || '0') ? -1 : 1,
  )[0];

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Open ${programme.name}, ${programme._count.subscriptions} of ${programme.enrolmentCapacity} joined`}
      style={styles.programmeCard}
    >
      <View style={styles.media}>
        {cheapest?.imageUrl ? (
          <Image
            source={{ uri: cheapest.imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            // Decorative: the package name and contents below say everything
            // the photograph does, so announcing it would only repeat them.
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        ) : (
          // A package without a photograph still needs to occupy the same
          // shape, or the list jumps as images resolve.
          <View style={[styles.imageFallback, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="basket-outline" size={32} color={colors.primary} />
          </View>
        )}
        <View style={[styles.joinedPill, { backgroundColor: colors.scrim }]}>
          <AppText weight="semibold" style={styles.joinedText}>
            {programme._count.subscriptions}/{programme.enrolmentCapacity} joined
          </AppText>
        </View>
      </View>

      <View style={styles.programmeBody}>
        <View style={styles.rowBetween}>
          <AppText weight="bold" style={styles.name} numberOfLines={2}>
            {programme.name}
          </AppText>
          <AppText weight="bold" style={{ color: colors.primary }}>
            {formatMinorAmount(
              cheapest?.priceMinor ?? programme.contributionMinor,
              programme.currency,
            )}
          </AppText>
        </View>

        {cheapest?.description ? (
          <AppText style={{ color: colors.textMuted }} numberOfLines={2}>
            {cheapest.description}
          </AppText>
        ) : null}

        <View style={styles.rowBetween}>
          <View style={styles.coordinatorLine}>
            {programme.coordinatorVerified ? (
              <AppBadge label="Verified" tone="warning" icon="shield-checkmark-outline" />
            ) : null}
            {programme.coordinatorName ? (
              <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
                {programme.coordinatorName}
              </AppText>
            ) : null}
          </View>
          <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
            {statusLabel(programme.contributionFrequency)} ·{' '}
            {fulfilmentLabel(programme.fulfilmentMethod)}
          </AppText>
        </View>

        {left > 0 && left <= 3 ? (
          <AppText weight="semibold" style={{ color: colors.warning, fontSize: fontSizes.caption }}>
            Only {left} {left === 1 ? 'place' : 'places'} left
          </AppText>
        ) : null}
        {left === 0 ? (
          <AppText
            weight="semibold"
            style={{ color: colors.textMuted, fontSize: fontSizes.caption }}
          >
            Full
          </AppText>
        ) : null}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },

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
  programmeCard: { gap: 0, overflow: 'hidden', padding: 0 },
  media: { height: 168, position: 'relative', width: '100%' },
  image: { height: '100%', width: '100%' },
  imageFallback: { alignItems: 'center', height: '100%', justifyContent: 'center', width: '100%' },
  joinedPill: {
    borderRadius: radius.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    position: 'absolute',
    right: spacing.sm,
  },
  joinedText: { color: '#FFFFFF', fontSize: fontSizes.caption },
  programmeBody: { gap: spacing.sm, padding: spacing.md },
  coordinatorLine: { alignItems: 'center', flexDirection: 'row', flex: 1, gap: spacing.sm },
  name: { flex: 1, fontSize: fontSizes.body },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
});
