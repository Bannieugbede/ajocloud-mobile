import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import type { CurrentUser } from '@/api/endpoints/users';
import { AppAmount } from '@/components/ui/app-amount';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreenHeader } from '@/components/ui/app-screen-header';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, palette, radius, sizes, spacing } from '@/theme';
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
      <AppScreenHeader
        eyebrow={greetingFor(now)}
        title={
          props.user
            ? `${props.user.profile.firstName} ${props.user.profile.lastName}`
            : 'Ajo Cloud member'
        }
        actions={[
          {
            icon: props.dark ? 'sunny-outline' : 'moon-outline',
            label: props.dark ? 'Switch to light mode' : 'Switch to dark mode',
            onPress: props.onToggleTheme,
          },
          {
            icon: 'notifications-outline',
            label:
              props.unreadCount > 0
                ? `Notifications, ${props.unreadCount} unread`
                : 'Notifications',
            onPress: props.onOpenNotifications,
            badge: props.unreadCount > 0,
          },
        ]}
      />

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

      <WalletCard {...props} />

      <Section title="Quick Actions">
        <View style={styles.actions}>
          {walletActions.map((action) => (
            <WalletActionButton key={action.label} action={action} />
          ))}
        </View>

        <View style={styles.tiles}>
          <WalletTile
            label="Savings"
            amountMinor={props.savingsMinor}
            currency={props.currency}
            hidden={!props.balanceVisible}
          />
          <WalletTile
            label="Rewards"
            amountMinor={props.rewardsMinor}
            currency={props.currency}
            hidden={!props.balanceVisible}
            accent
          />
        </View>
      </Section>

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

/**
 * The mark printed faintly across the hero. Purely decorative — it is drawn
 * behind the figures at low opacity and carries no information the text does
 * not already give, so it is hidden from assistive technology.
 */
function WalletWatermark() {
  return (
    <View
      style={styles.watermark}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
        <Path d="M50 8 L88 92 L68 92 L50 48 L32 92 L12 92 Z" fill="rgba(255,255,255,0.07)" />
        <Path d="M50 56 L62 84 L38 84 Z" fill="rgba(255,255,255,0.05)" />
      </Svg>
    </View>
  );
}

/**
 * The hero: one figure, stated once, on the brand gradient.
 *
 * The gradient runs from the brand blue into its darker shade rather than
 * sitting flat, and the watermark gives the card depth without adding a second
 * thing to read. The wallet actions used to live inside this card; they now sit
 * in their own labelled section beneath it, so the card holds balances and the
 * section holds verbs.
 */
function WalletCard(props: HomeScreenProps) {
  return (
    <View style={styles.wallet}>
      <LinearGradient
        colors={[palette.blue500, palette.blue600, palette.blue700]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <WalletWatermark />

      <View style={styles.rowBetween}>
        <AppText weight="medium" style={styles.walletLabel}>
          Main Wallet
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={props.balanceVisible ? 'Hide wallet balance' : 'Show wallet balance'}
          hitSlop={12}
          onPress={props.onToggleBalance}
        >
          <Ionicons
            name={props.balanceVisible ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color="rgba(255,255,255,0.72)"
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
          size="display"
          onInverse
          hidden={!props.balanceVisible}
          testID="home-wallet-balance"
        />
      )}

      <AppText style={styles.walletCaption}>Available to spend</AppText>
    </View>
  );
}

/**
 * A savings or rewards total, on its own card.
 *
 * These used to sit inside the hero. The hero now carries one figure — the
 * spendable balance — so the other two moved out rather than being dropped:
 * they are still the member's money, and a card on the page states them without
 * competing with the headline. They mask with the wallet, since hiding the
 * balance and leaving these legible would defeat the point of the toggle.
 */
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
    <AppCard style={styles.tile} testID={`home-tile-${label.toLowerCase()}`}>
      <View
        style={[
          styles.tileIcon,
          { backgroundColor: accent ? colors.secondarySoft : colors.primarySoft },
        ]}
      >
        <Ionicons
          name={accent ? 'gift-outline' : 'wallet-outline'}
          size={18}
          color={accent ? colors.secondary : colors.primary}
        />
      </View>
      <View style={styles.tileText} accessible accessibilityLabel={`${label} balance`}>
        <AppText style={[styles.tileLabel, { color: colors.textMuted }]}>{label}</AppText>
        <AppAmount amountMinor={amountMinor} currency={currency} hidden={hidden} />
      </View>
    </AppCard>
  );
}

/**
 * One Quick Action: a rounded-square icon tile over its label.
 *
 * Now that the actions sit on the page rather than on the brand fill, they are
 * drawn in theme tokens like the rest of the screen. A locked action keeps its
 * place in the row — reordering the row as funding comes and goes would move a
 * target out from under whoever was reaching for it — and states its reason in
 * the accessible name rather than only dimming.
 */
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
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: colors.primarySoft, borderColor: colors.border },
        ]}
      >
        <Ionicons
          name={locked ? 'lock-closed-outline' : action.icon}
          color={colors.primary}
          size={22}
        />
      </View>
      <AppText weight="medium" style={[styles.actionText, { color: colors.text }]}>
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

  notice: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md },

  wallet: {
    borderRadius: radius.xl,
    gap: spacing.xs,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  watermark: {
    bottom: -spacing.lg,
    opacity: 0.9,
    position: 'absolute',
    right: -spacing.xl,
    top: -spacing.lg,
    width: '62%',
  },
  walletLabel: { color: 'rgba(255,255,255,0.78)', fontSize: fontSizes.body },
  walletCaption: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: fontSizes.caption,
    marginBottom: spacing.xs,
  },
  balanceUnavailable: { color: '#FFFFFF', fontSize: fontSizes.title },
  tiles: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  tile: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.sm },
  tileIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  tileText: { flex: 1, gap: 2 },
  tileLabel: { fontSize: fontSizes.caption },

  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'flex-start',
    minHeight: sizes.touchTarget,
    paddingVertical: spacing.xs,
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  actionText: { fontSize: fontSizes.caption, textAlign: 'center' },

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
