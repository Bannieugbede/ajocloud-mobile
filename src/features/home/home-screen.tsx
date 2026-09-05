import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import type { CurrentUser } from '@/api/endpoints/users';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';
import { statusLabel } from '@/utils/status';

import {
  categoryIcon,
  categoryTone,
  greetingFor,
  relativeDueLabel,
  type CategoryTone,
  type QuickPayItem,
  type UpcomingItem,
} from './home-data';

/** The bill categories the design surfaces first, by the name the API uses. */
const CATEGORY_SHORTCUTS = ['Electricity', 'Water', 'Cable TV', 'Internet'] as const;

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
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  error: boolean;
  balanceVisible: boolean;
  /** True when the resolved theme is dark, for the header toggle's icon. */
  dark: boolean;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
  onToggleBalance: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  onOpenAjo: () => void;
  onOpenGroup: (groupId: string) => void;
  onOpenUpcoming: (item: UpcomingItem) => void;
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
 *
 * The header is drawn here rather than by the navigator. It carries the
 * greeting, the member's name and two controls, and scrolls away with the
 * content instead of pinning a title bar above a screen that already names
 * itself — the one screen in the app where that is the right trade.
 */
export function HomeScreen(props: HomeScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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
      <View style={styles.header}>
        <View style={styles.greeting}>
          <AppText style={{ color: colors.textMuted }}>{greetingFor(now)}</AppText>
          <AppText accessibilityRole="header" weight="bold" style={styles.name} numberOfLines={1}>
            {props.user
              ? `${props.user.profile.firstName} ${props.user.profile.lastName}`
              : 'Ajo Cloud member'}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <RoundButton
            icon={props.dark ? 'sunny-outline' : 'moon-outline'}
            label={props.dark ? 'Switch to light mode' : 'Switch to dark mode'}
            onPress={props.onToggleTheme}
          />
          <RoundButton
            icon="notifications-outline"
            label={
              props.unreadCount > 0 ? `Notifications, ${props.unreadCount} unread` : 'Notifications'
            }
            onPress={props.onOpenNotifications}
            badge={props.unreadCount > 0}
          />
        </View>
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
          {CATEGORY_SHORTCUTS.map((name) => (
            <CategoryShortcut key={name} name={name} onPress={() => props.onOpenCategory(name)} />
          ))}
        </View>

        {props.quickPay.map((item) => (
          <QuickPayCard key={item.paymentId} item={item} onPress={() => props.onQuickPay(item)} />
        ))}
      </Section>

      <Section title="Upcoming Activity">
        {props.upcoming.length ? (
          props.upcoming.map((item) => (
            <UpcomingRow
              key={item.id}
              item={item}
              now={now}
              onPress={() => props.onOpenUpcoming(item)}
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

function RoundButton({
  icon,
  label,
  onPress,
  badge = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  badge?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.roundButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      {badge ? (
        // Decorative: the unread count is already in the button's label, so
        // announcing the dot again would repeat it.
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          style={[styles.badgeDot, { backgroundColor: colors.error, borderColor: colors.surface }]}
        />
      ) : null}
    </Pressable>
  );
}

function WalletCard(props: HomeScreenProps & { actions: WalletAction[] }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wallet, { backgroundColor: colors.primary }]}>
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
        size={20}
      />
      <AppText weight="medium" style={styles.actionText}>
        {action.label}
      </AppText>
    </Pressable>
  );
}

/** Resolves a category's tone to the token pair it is drawn in. */
function useToneColors(tone: CategoryTone) {
  const { colors } = useTheme();
  return {
    warning: { text: colors.warning, background: colors.warningSoft },
    info: { text: colors.info, background: colors.infoSoft },
    secondary: { text: colors.secondary, background: colors.secondarySoft },
    primary: { text: colors.primary, background: colors.primarySoft },
  }[tone];
}

function CategoryShortcut({ name, onPress }: { name: string; onPress: () => void }) {
  const { colors } = useTheme();
  const tone = useToneColors(categoryTone(name));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pay ${name} bill`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.shortcut,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.shortcutIcon, { backgroundColor: tone.background }]}>
        <Ionicons name={categoryIcon(name)} size={20} color={tone.text} />
      </View>
      <AppText weight="medium" style={styles.shortcutLabel} numberOfLines={1}>
        {name}
      </AppText>
    </Pressable>
  );
}

function QuickPayCard({ item, onPress }: { item: QuickPayItem; onPress: () => void }) {
  const { colors } = useTheme();
  const tone = useToneColors(categoryTone(item.categoryName ?? ''));

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`Pay ${item.billerName} again, last paid ${formatMinorAmount(
        item.amountMinor,
        item.currency,
      )}`}
      style={styles.listCard}
    >
      <View style={[styles.listIcon, { backgroundColor: tone.background }]}>
        <Ionicons name={categoryIcon(item.categoryName ?? '')} size={20} color={tone.text} />
      </View>
      <View style={styles.listText}>
        <AppText weight="semibold" numberOfLines={1}>
          {item.billerName}
        </AppText>
        <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
          {item.customerReferenceMasked}
        </AppText>
      </View>
      <View style={styles.listRight}>
        <AppAmount amountMinor={item.amountMinor} currency={item.currency} />
        <AppText weight="semibold" style={{ color: colors.primary, fontSize: fontSizes.caption }}>
          Quick Pay
        </AppText>
      </View>
    </AppCard>
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
        : item.kind === 'POOL_DUE'
          ? { text: 'Pending', color: colors.warning, soft: colors.warningSoft }
          : { text: 'Scheduled', color: colors.textMuted, soft: colors.surfaceMuted };

  const relative = relativeDueLabel(item.dueAt, now);
  const verb = incoming ? 'Payout' : 'Pay';
  const icon = incoming
    ? 'arrow-down-outline'
    : item.kind === 'POOL_DUE'
      ? 'clipboard-outline'
      : 'arrow-up-outline';

  // A pending pool due is tinted so it stands out from the dated rows around
  // it, matching the design's emphasis on the one thing still unsettled.
  const emphasised = item.kind === 'POOL_DUE';

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`${verb} ${item.groupName}, ${formatMinorAmount(
        item.amountMinor,
        item.currency,
      )}, ${tone.text}${relative ? `, due ${relative}` : ''}`}
      style={[styles.listCard, emphasised ? { backgroundColor: colors.warningSoft } : null]}
    >
      <View style={[styles.listIcon, { backgroundColor: tone.soft }]}>
        <Ionicons name={icon} size={20} color={tone.color} />
      </View>
      <View style={styles.listText}>
        <AppText weight="semibold" numberOfLines={1}>
          {verb} · {item.groupName}
        </AppText>
        <AppText style={{ color: colors.textMuted }} numberOfLines={1}>
          {relative || 'Scheduled'}
          {item.product ? ` · ${item.product}` : ''}
        </AppText>
      </View>
      <View style={styles.listRight}>
        <AppAmount
          amountMinor={item.amountMinor}
          currency={item.currency}
          style={
            incoming
              ? { color: colors.success }
              : emphasised
                ? { color: colors.warning }
                : undefined
          }
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
  const filled = group.maxSlots > 0 ? group._count.slots / group.maxSlots : 0;
  // A group waiting on its members is the one with something to act on, so it
  // is flagged rather than left reading the same as a running rotation.
  const awaiting = group.status === 'LOCKED' || group.status === 'OPEN';
  const badge = awaiting
    ? { text: 'PAYOUT', color: colors.warning, soft: colors.warningSoft }
    : {
        text: statusLabel(group.status).toUpperCase(),
        color: colors.success,
        soft: colors.successSoft,
      };

  return (
    <AppCard
      onPress={onPress}
      accessibilityLabel={`${group.name}, ${statusLabel(group.status)}, ${formatMinorAmount(
        group.baseContributionMinor,
        group.currency,
      )} ${statusLabel(group.contributionFrequency).toLowerCase()}, ${group._count.slots} of ${
        group.maxSlots
      } slots`}
      style={styles.groupCard}
    >
      <View style={[styles.groupBadge, { backgroundColor: badge.soft }]}>
        <AppText weight="semibold" style={[styles.groupBadgeText, { color: badge.color }]}>
          {badge.text}
        </AppText>
      </View>
      <AppText weight="semibold" numberOfLines={2}>
        {group.name}
      </AppText>
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }} numberOfLines={1}>
        {formatMinorAmount(group.baseContributionMinor, group.currency)}/
        {statusLabel(group.contributionFrequency)}
      </AppText>
      {/* A plain bar rather than AppProgress: the percentage it prints would
          repeat the slot count that sits directly beneath it. */}
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[styles.track, { backgroundColor: colors.surfaceMuted }]}
      >
        <View
          style={[
            styles.trackFill,
            { backgroundColor: colors.primary, width: `${Math.round(filled * 100)}%` },
          ]}
        />
      </View>
      <AppText style={{ color: colors.textMuted, fontSize: fontSizes.caption }}>
        Pos: {group._count.slots}/{group.maxSlots}
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
        <AppText accessibilityRole="header" weight="bold" style={styles.sectionTitle}>
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
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },

  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  greeting: { flex: 1, gap: 2 },
  name: { fontSize: fontSizes.title },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  roundButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  badgeDot: {
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 9,
    top: 9,
    width: 10,
  },

  notice: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md },

  wallet: { borderRadius: radius.lg, gap: spacing.md, overflow: 'hidden', padding: spacing.md },
  walletLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.caption, letterSpacing: 1.2 },
  balanceUnavailable: { color: '#FFFFFF', fontSize: fontSizes.title },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  tileLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.caption, letterSpacing: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: sizes.touchTarget + 12,
    padding: spacing.sm,
  },
  actionText: { color: '#FFFFFF', fontSize: fontSizes.caption },

  shortcuts: { flexDirection: 'row', gap: spacing.sm },
  shortcut: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 92,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  shortcutIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  shortcutLabel: { fontSize: fontSizes.caption, textAlign: 'center' },

  listCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  listIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  listText: { flex: 1, gap: 2 },
  listRight: { alignItems: 'flex-end', gap: 2 },

  groupRow: { flexDirection: 'row', gap: spacing.sm },
  groupCard: { flex: 1, gap: spacing.sm },
  groupBadge: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  groupBadgeText: { fontSize: 10, letterSpacing: 0.6 },
  track: { borderRadius: radius.pill, height: 6, overflow: 'hidden', width: '100%' },
  trackFill: { borderRadius: radius.pill, height: '100%' },

  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.title - 4 },
  sectionAction: {
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },
  rowBetween: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
