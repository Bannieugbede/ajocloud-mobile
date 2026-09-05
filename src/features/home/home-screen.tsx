import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import type { CurrentUser } from '@/api/endpoints/users';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppProgress } from '@/components/ui/app-progress';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import { greetingFor, relativeDueLabel, type QuickPayItem, type UpcomingItem } from './home-data';

/** The bill categories the design surfaces first, by the name the API uses. */
const CATEGORY_SHORTCUTS = [
  { name: 'Electricity', icon: 'flash-outline' },
  { name: 'Water', icon: 'water-outline' },
  { name: 'Cable TV', icon: 'tv-outline' },
  { name: 'Internet', icon: 'wifi-outline' },
] as const;

type WalletAction = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress?: () => void;
  /** Why the action cannot be used yet. A locked action explains itself. */
  unavailable?: string;
};

export type HomeScreenProps = {
  user?: CurrentUser;
  groups?: AjoGroupSummary[];
  upcoming: UpcomingItem[];
  quickPay: QuickPayItem[];
  /** Spendable balance in minor units, or undefined while unknown. */
  availableMinor?: string;
  savingsMinor: string;
  rewardsMinor: string;
  currency: string;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  balanceVisible: boolean;
  onToggleBalance: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  onOpenAjo: () => void;
  onOpenGroup: (groupId: string) => void;
  onPayContribution: (item: UpcomingItem) => void;
  onOpenBills: () => void;
  onOpenCategory: (categoryName: string) => void;
  onQuickPay: (item: QuickPayItem) => void;
  onFund?: () => void;
  onSend: () => void;
  onWithdraw: () => void;
};

/**
 * The dashboard: what the member is worth, what is due, and what they belong to.
 *
 * Presentational throughout. Every figure arrives already derived by
 * `home-data`, so the arithmetic behind a balance or a due date is unit-tested
 * rather than buried in a render.
 */
export function HomeScreen(props: HomeScreenProps) {
  const { colors } = useTheme();
  const now = new Date();

  const walletActions: WalletAction[] = [
    {
      label: 'Fund',
      icon: 'add-outline',
      ...(props.onFund
        ? { onPress: props.onFund }
        : { unavailable: 'Funding opens when card and transfer payments go live.' }),
    },
    { label: 'Send', icon: 'paper-plane-outline', onPress: props.onSend },
    { label: 'Withdraw', icon: 'arrow-down-outline', onPress: props.onWithdraw },
    { label: 'Bills', icon: 'flash-outline', onPress: props.onOpenBills },
  ];

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
      <View style={styles.greeting}>
        <AppText style={{ color: colors.textMuted }}>{greetingFor(now)}</AppText>
        <AppText accessibilityRole="header" weight="bold" style={styles.name}>
          {props.user
            ? `${props.user.profile.firstName} ${props.user.profile.lastName}`
            : 'Ajo Cloud member'}
        </AppText>
      </View>

      {props.error ? (
        <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
          <AppText weight="semibold" style={{ color: colors.error }}>
            Some information could not be refreshed
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            What is shown below may be out of date.
          </AppText>
          <AppButton label="Try again" variant="outline" onPress={props.onRetry} />
        </View>
      ) : null}

      <WalletCard {...props} actions={walletActions} />

      <Section title="Pay Bills" action="See all" onAction={props.onOpenBills}>
        <View style={styles.shortcuts}>
          {CATEGORY_SHORTCUTS.map((shortcut) => (
            <Pressable
              key={shortcut.name}
              accessibilityRole="button"
              accessibilityLabel={`Pay ${shortcut.name} bill`}
              onPress={() => props.onOpenCategory(shortcut.name)}
              style={({ pressed }) => [
                styles.shortcut,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.shortcutIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={shortcut.icon} size={20} color={colors.primary} />
              </View>
              <AppText weight="medium" style={styles.shortcutLabel} numberOfLines={1}>
                {shortcut.name}
              </AppText>
            </Pressable>
          ))}
        </View>

        {props.quickPay.map((item) => (
          <AppCard
            key={item.paymentId}
            onPress={() => props.onQuickPay(item)}
            accessibilityLabel={`Pay ${item.billerName} again, last paid ${formatMinorAmount(
              item.amountMinor,
              item.currency,
            )}`}
            style={styles.quickPayCard}
          >
            <View style={[styles.quickPayIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="receipt-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.quickPayText}>
              <AppText weight="semibold" numberOfLines={1}>
                {item.billerName}
              </AppText>
              <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
                {item.categoryName ? `${item.categoryName} · ` : ''}
                {item.customerReferenceMasked}
              </AppText>
            </View>
            <View style={styles.quickPayRight}>
              <AppAmount amountMinor={item.amountMinor} currency={item.currency} />
              <AppText
                weight="semibold"
                style={{ color: colors.primary, fontSize: fontSizes.caption }}
              >
                Pay again
              </AppText>
            </View>
          </AppCard>
        ))}
      </Section>

      <Section title="Upcoming Activity">
        {props.upcoming.length ? (
          props.upcoming.map((item) => (
            <UpcomingRow
              key={item.id}
              item={item}
              now={now}
              onPress={() =>
                item.kind === 'CONTRIBUTION'
                  ? props.onPayContribution(item)
                  : props.onOpenGroup(item.groupId)
              }
            />
          ))
        ) : (
          <AppCard>
            <AppText style={{ color: colors.textMuted }}>
              {props.loading
                ? 'Loading your schedule…'
                : 'Nothing is due. Contributions and payouts appear here once a group starts.'}
            </AppText>
          </AppCard>
        )}
      </Section>

      <Section title="My Ajo Groups" action="See all" onAction={props.onOpenAjo}>
        {props.groups?.length ? (
          <View style={styles.groupRow}>
            {props.groups.slice(0, 2).map((group) => (
              <GroupCard key={group.id} group={group} onPress={() => props.onOpenGroup(group.id)} />
            ))}
          </View>
        ) : (
          <AppCard>
            <AppText style={{ color: colors.textMuted }}>
              You have not joined an Ajo group yet.
            </AppText>
          </AppCard>
        )}
      </Section>
    </ScrollView>
  );
}

function WalletCard(props: HomeScreenProps & { actions: WalletAction[] }) {
  const { colors } = useTheme();
  return (
    <View accessible={false} style={[styles.wallet, { backgroundColor: colors.primary }]}>
      <View style={styles.rowBetween}>
        <AppText weight="semibold" style={styles.walletLabel}>
          MAIN WALLET
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={props.balanceVisible ? 'Hide wallet balance' : 'Show wallet balance'}
          hitSlop={12}
          onPress={props.onToggleBalance}
        >
          <Ionicons
            name={props.balanceVisible ? 'eye-outline' : 'eye-off-outline'}
            size={22}
            color={colors.textInverse}
          />
        </Pressable>
      </View>

      {props.availableMinor === undefined ? (
        <AppText weight="bold" style={styles.balanceUnavailable}>
          {props.loading ? 'Loading…' : 'Balance unavailable'}
        </AppText>
      ) : (
        <AppAmount
          amountMinor={props.availableMinor}
          currency={props.currency}
          size="heading"
          onInverse
          hidden={!props.balanceVisible}
          testID="home-wallet-balance"
        />
      )}

      <View style={styles.tiles}>
        <WalletTile
          label="SAVINGS"
          amountMinor={props.savingsMinor}
          currency={props.currency}
          hidden={!props.balanceVisible}
        />
        <WalletTile
          label="REWARDS"
          amountMinor={props.rewardsMinor}
          currency={props.currency}
          hidden={!props.balanceVisible}
          accent
        />
      </View>

      <View style={styles.actions}>
        {props.actions.map((action) => (
          <WalletActionButton key={action.label} action={action} />
        ))}
      </View>
    </View>
  );
}

function WalletTile({
  label,
  amountMinor,
  currency,
  hidden,
  accent = false,
}: {
  label: string;
  amountMinor: string;
  currency: string;
  hidden: boolean;
  accent?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label.toLowerCase()} balance`}>
      <AppText weight="semibold" style={styles.tileLabel}>
        {label}
      </AppText>
      <AppAmount
        amountMinor={amountMinor}
        currency={currency}
        hidden={hidden}
        onInverse
        style={accent ? { color: colors.secondary } : undefined}
      />
    </View>
  );
}

function WalletActionButton({ action }: { action: WalletAction }) {
  const { colors } = useTheme();
  const locked = !action.onPress;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        locked ? `${action.label}, unavailable. ${action.unavailable}` : action.label
      }
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={action.onPress}
      style={({ pressed }) => [styles.action, { opacity: locked ? 0.45 : pressed ? 0.7 : 1 }]}
    >
      <Ionicons
        name={locked ? 'lock-closed-outline' : action.icon}
        color={colors.textInverse}
        size={18}
      />
      <AppText weight="medium" style={styles.actionText}>
        {action.label}
      </AppText>
    </Pressable>
  );
}

function UpcomingRow({
  item,
  now,
  onPress,
}: {
  item: UpcomingItem;
  now: Date;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const incoming = item.kind === 'PAYOUT';

  // Status is carried by the label as well as the colour: colour alone is not
  // a status anyone can read.
  const tone = incoming
    ? { text: 'Incoming', color: colors.success, soft: colors.successSoft }
    : item.urgency === 'OVERDUE'
      ? { text: 'Overdue', color: colors.error, soft: colors.errorSoft }
      : item.urgency === 'DUE_SOON'
        ? { text: 'Due soon', color: colors.warning, soft: colors.warningSoft }
        : { text: 'Scheduled', color: colors.textMuted, soft: colors.surfaceMuted };

  const relative = relativeDueLabel(item.dueAt, now);
  const verb = incoming ? 'Payout' : 'Pay';

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`${verb} ${item.groupName}, ${formatMinorAmount(
        item.amountMinor,
        item.currency,
      )}, ${tone.text}${relative ? `, due ${relative}` : ''}`}
      style={styles.upcomingCard}
    >
      <View style={[styles.upcomingIcon, { backgroundColor: tone.soft }]}>
        <Ionicons
          name={incoming ? 'arrow-down-outline' : 'arrow-up-outline'}
          size={18}
          color={tone.color}
        />
      </View>
      <View style={styles.upcomingText}>
        <AppText weight="semibold" numberOfLines={1}>
          {verb} · {item.groupName}
        </AppText>
        <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
          {relative ? `${relative}` : 'Scheduled'}
        </AppText>
      </View>
      <View style={styles.upcomingRight}>
        <AppAmount
          amountMinor={item.amountMinor}
          currency={item.currency}
          style={incoming ? { color: colors.success } : undefined}
        />
        <AppText weight="semibold" style={{ color: tone.color, fontSize: fontSizes.caption }}>
          {tone.text}
        </AppText>
      </View>
    </AppCard>
  );
}

function GroupCard({ group, onPress }: { group: AjoGroupSummary; onPress: () => void }) {
  const { colors } = useTheme();
  const filled =
    group.maxSlots > 0 ? Math.round((group._count.slots / group.maxSlots) * 10_000) : 0;

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`${group.name}, ${statusLabel(group.status)}`}
      style={styles.groupCard}
    >
      <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
        <AppText weight="semibold" style={[styles.badgeText, { color: colors.primary }]}>
          {statusLabel(group.status)}
        </AppText>
      </View>
      <AppText weight="semibold" numberOfLines={2}>
        {group.name}
      </AppText>
      <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
        {formatMinorAmount(group.baseContributionMinor, group.currency)} ·{' '}
        {statusLabel(group.contributionFrequency)}
      </AppText>
      <AppProgress progressBps={filled} label={`${group.name} slots filled`} showValue={false} />
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
        {group._count.slots} of {group.maxSlots} slots
      </AppText>
    </AppCard>
  );
}

function Section({
  title,
  action,
  onAction,
  children,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <AppText accessibilityRole="header" weight="semibold" style={styles.sectionTitle}>
          {title}
        </AppText>
        {action && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${action} ${title}`}
            onPress={onAction}
            style={styles.sectionAction}
          >
            <AppText weight="semibold" style={{ color: colors.primary }}>
              {action}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  greeting: { gap: spacing.xs },
  name: { fontSize: fontSizes.title },
  notice: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md },

  wallet: { borderRadius: radius.lg, gap: spacing.md, overflow: 'hidden', padding: spacing.lg },
  walletLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.caption, letterSpacing: 1.2 },
  balanceUnavailable: { color: '#FFFFFF', fontSize: fontSizes.title },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  tileLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.caption, letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    padding: spacing.sm,
  },
  actionText: { color: '#FFFFFF', fontSize: fontSizes.caption },

  shortcuts: { flexDirection: 'row', gap: spacing.sm },
  shortcut: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 84,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  shortcutIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  shortcutLabel: { fontSize: fontSizes.caption, textAlign: 'center' },

  quickPayCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  quickPayIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  quickPayText: { flex: 1, gap: spacing.xs },
  quickPayRight: { alignItems: 'flex-end', gap: spacing.xs },

  upcomingCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  upcomingIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  upcomingText: { flex: 1, gap: spacing.xs },
  upcomingRight: { alignItems: 'flex-end', gap: spacing.xs },

  groupRow: { flexDirection: 'row', gap: spacing.sm },
  groupCard: { flex: 1, gap: spacing.sm },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: { fontSize: fontSizes.caption, letterSpacing: 0.4 },

  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.body },
  sectionAction: {
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },
  rowBetween: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
