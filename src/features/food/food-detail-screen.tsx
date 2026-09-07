import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { FoodPackage, FoodProgramme, FoodSubscription } from '@/api/endpoints/food-ajo';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppFloatBack } from '@/components/ui/app-float-back';
import { AppImageHero } from '@/components/ui/app-image-hero';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppStatTiles } from '@/components/ui/app-stat-tiles';
import { AppSkeletonCard } from '@/components/ui/app-skeleton';
import { AppErrorState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { longDate } from '@/utils/dates';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import {
  fulfilmentLabel,
  isEnrolled,
  joinBlockedReason,
  placesLeft,
  priceLabel,
} from './programme-summary';

type Panel = 'details' | 'schedule';

/**
 * One food programme, from both sides: browsing it, and being in it.
 *
 * The two states share everything above the fold — the photograph, who runs it,
 * and the four facts that decide whether to join — because they answer the same
 * question. What differs is the action at the bottom and, once joined, a second
 * panel for the member's own payments.
 */
export function FoodDetailScreen({
  programme,
  subscription,
  loading,
  error,
  refreshing,
  submitting,
  actionError,
  onRefresh,
  onRetry,
  onSubscribe,
  onUnsubscribe,
}: {
  programme?: FoodProgramme;
  /** The viewer's own enrolment in this programme, if any. */
  subscription?: FoodSubscription | null;
  loading: boolean;
  error: boolean;
  refreshing?: boolean;
  submitting?: boolean;
  actionError?: AppError | null;
  onRefresh?: () => void;
  onRetry: () => void;
  onSubscribe: (packageId: string) => void;
  onUnsubscribe: () => void;
}) {
  const { colors } = useTheme();
  const [panel, setPanel] = useState<Panel>('details');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // The back control belongs in these states too: the navigator draws no
  // header here, so without it a failed load has no way out but the tab bar.
  if (loading) {
    return (
      <View style={[styles.states, { backgroundColor: colors.background }]}>
        <AppFloatBack fallback="/(tabs)/food" />
        <AppSkeletonCard testID="food-detail-skeleton" />
        <AppSkeletonCard />
      </View>
    );
  }

  if (error || !programme) {
    return (
      <View style={[styles.states, { backgroundColor: colors.background }]}>
        <AppFloatBack fallback="/(tabs)/food" />
        <AppErrorState
          title="Could not load this programme"
          description="Check your connection and try again."
          onRetry={onRetry}
        />
      </View>
    );
  }

  const enrolled = isEnrolled(subscription);
  const blocked = joinBlockedReason(programme);
  const spots = placesLeft(programme);

  // The package a member is enrolled in, or the one they have tapped. Falls
  // back to the first so the contents below are never empty on a programme
  // that only offers one.
  const selected: FoodPackage | undefined = enrolled
    ? programme.packages.find((entry) => entry.id === subscription?.packageId)
    : (programme.packages.find((entry) => entry.id === selectedId) ?? programme.packages[0]);

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="never"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <AppImageHero
        testID="food-detail-hero"
        imageUrl={selected?.imageUrl}
        title={selected?.name ?? programme.name}
        badge={enrolled ? <AppBadge label="Joined" tone="success" /> : null}
        trailing={<AppFloatBack fallback="/(tabs)/food" />}
        subtitle={
          <>
            {programme.coordinatorVerified ? (
              <AppBadge label="Verified" tone="warning" icon="shield-checkmark-outline" />
            ) : null}
            {programme.coordinatorName ? (
              <AppText style={styles.coordinator} numberOfLines={1}>
                {programme.coordinatorName}
              </AppText>
            ) : null}
          </>
        }
      />

      <View style={styles.body}>
        {enrolled ? (
          <AppSegmented
            label={programme.name}
            value={panel}
            onChange={setPanel}
            options={[
              { value: 'details', label: 'Details' },
              { value: 'schedule', label: 'Payment Schedule' },
            ]}
            testID="food-detail-tabs"
          />
        ) : null}

        {panel === 'details' || !enrolled ? (
          <>
            {selected?.description ? (
              <AppText style={{ color: colors.textMuted }}>{selected.description}</AppText>
            ) : null}

            <AppStatTiles
              columns={2}
              align="start"
              testID="food-detail-stats"
              stats={[
                { label: 'Price', value: priceLabel(programme, formatMinorAmount) },
                {
                  label: 'Members',
                  value: `${programme._count.subscriptions} / ${programme.enrolmentCapacity}`,
                },
                {
                  label: 'Spots Left',
                  value: String(spots),
                  tone: spots === 0 ? 'warning' : 'default',
                },
                { label: 'Next Distribution', value: longDate(programme.distributionAt) },
              ]}
            />

            {/* Offered only where there is a real choice: one package is the
                programme, not a decision. */}
            {!enrolled && programme.packages.length > 1 ? (
              <View style={styles.section}>
                <AppText accessibilityRole="header" weight="semibold" style={styles.heading}>
                  Choose a package
                </AppText>
                {programme.packages.map((entry) => (
                  <PackageOption
                    key={entry.id}
                    entry={entry}
                    selected={entry.id === selected?.id}
                    onPress={() => setSelectedId(entry.id)}
                  />
                ))}
              </View>
            ) : null}

            {selected?.items.length ? (
              <View style={styles.section}>
                <AppText accessibilityRole="header" weight="semibold" style={styles.heading}>
                  Package Contents
                </AppText>
                <View style={styles.contents}>
                  {selected.items.map((item) => (
                    <View
                      key={item.id}
                      accessible
                      accessibilityLabel={`${item.name}, ${item.quantity} ${item.unit}`}
                      style={styles.item}
                    >
                      <View style={[styles.tick, { backgroundColor: colors.successSoft }]}>
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={colors.success}
                          accessibilityElementsHidden
                          importantForAccessibility="no"
                        />
                      </View>
                      <AppText numberOfLines={1}>
                        {item.name} {item.quantity}
                        {item.unit}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {selected && !selected.priceLockedAt ? (
              <View style={[styles.notice, { backgroundColor: colors.warningSoft }]}>
                <AppText style={{ color: colors.text }}>
                  {/* Said before joining rather than after: the price can still
                      move until the coordinator locks it. */}
                  This price is not locked yet, so it may change before buying starts.
                </AppText>
              </View>
            ) : null}
          </>
        ) : (
          <PaymentSchedule programme={programme} subscription={subscription ?? null} />
        )}

        {actionError ? (
          <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
            <AppText accessibilityLiveRegion="polite" style={{ color: colors.error }}>
              {actionError.message}
            </AppText>
          </View>
        ) : null}

        {enrolled ? (
          <View style={styles.section}>
            {panel === 'details' ? (
              <AppButton
                label="View Payment Schedule"
                variant="outline"
                onPress={() => setPanel('schedule')}
              />
            ) : null}
            <AppButton
              label="Leave this programme"
              variant="ghost"
              onPress={onUnsubscribe}
              loading={submitting ?? false}
            />
          </View>
        ) : (
          <View style={styles.section}>
            <AppButton
              label={blocked ? 'Not taking members' : 'Join Package'}
              onPress={() => selected && onSubscribe(selected.id)}
              loading={submitting ?? false}
              disabled={blocked !== null || !selected}
            />
            {/* A disabled button with no reason beside it is the thing people
                complain about. */}
            {blocked ? (
              <AppText style={[styles.hint, { color: colors.textMuted }]}>{blocked}</AppText>
            ) : null}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function PackageOption({
  entry,
  selected,
  onPress,
}: {
  entry: FoodPackage;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`${entry.name}, ${formatMinorAmount(entry.priceMinor, entry.currency)}${
        selected ? ', selected' : ''
      }`}
      style={[styles.option, selected && { borderColor: colors.primary, borderWidth: 2 }]}
    >
      <View style={styles.optionRow}>
        <AppText weight="semibold" numberOfLines={1} style={styles.optionName}>
          {entry.name}
        </AppText>
        <AppText weight="bold" style={{ color: colors.primary }}>
          {formatMinorAmount(entry.priceMinor, entry.currency)}
        </AppText>
      </View>
      {entry.description ? (
        <AppText style={{ color: colors.textMuted }} numberOfLines={2}>
          {entry.description}
        </AppText>
      ) : null}
    </AppCard>
  );
}

/**
 * The member's own payments.
 *
 * There is no Food contribution model on the backend — no payment records, no
 * schedule endpoint — so this states what is known from the programme's own
 * terms and says plainly that individual payments are not tracked yet. Drawing
 * a progress bar over a percentage nobody has computed would be inventing a
 * figure about someone's money.
 */
function PaymentSchedule({
  programme,
  subscription,
}: {
  programme: FoodProgramme;
  subscription: FoodSubscription | null;
}) {
  const { colors } = useTheme();
  const quantity = subscription?.quantity ?? 1;

  return (
    <View style={styles.section}>
      <AppCard style={styles.scheduleCard}>
        <AppText accessibilityRole="header" weight="semibold" style={styles.heading}>
          Your enrolment
        </AppText>
        <ScheduleRow label="Package" value={subscription?.package.name ?? '—'} />
        <ScheduleRow label="Portions" value={`${quantity} portion${quantity === 1 ? '' : 's'}`} />
        <ScheduleRow label="Contribution" value={priceLabel(programme, formatMinorAmount)} />
        <ScheduleRow label="Status" value={statusLabel(subscription?.status ?? 'PENDING')} />
        <ScheduleRow label="How you collect" value={fulfilmentLabel(programme.fulfilmentMethod)} />
        <ScheduleRow label="Next distribution" value={longDate(programme.distributionAt)} />
      </AppCard>

      <View style={[styles.notice, { backgroundColor: colors.infoSoft }]}>
        <AppText weight="semibold" style={{ color: colors.info }}>
          Payments are not tracked here yet
        </AppText>
        <AppText style={{ color: colors.textMuted }}>
          Your coordinator collects contributions for this programme. Once payments run through Ajo
          Cloud, each one will be listed here with the date it was received.
        </AppText>
      </View>
    </View>
  );
}

function ScheduleRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.scheduleRow}>
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText weight="semibold" style={styles.scheduleValue} numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: spacing.xxl },
  states: { gap: spacing.md, padding: spacing.md },
  body: { gap: spacing.md, padding: spacing.md },
  coordinator: { color: 'rgba(255,255,255,0.86)' },
  section: { gap: spacing.sm },
  heading: { fontSize: fontSizes.body },
  contents: { gap: spacing.sm },
  item: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  tick: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  option: { gap: spacing.xs },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  optionName: { flex: 1 },
  notice: { borderRadius: radius.lg, gap: spacing.xs, padding: spacing.md },
  hint: { fontSize: fontSizes.caption },
  scheduleCard: { gap: spacing.sm },
  scheduleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  scheduleValue: { flexShrink: 1, textAlign: 'right' },
});
