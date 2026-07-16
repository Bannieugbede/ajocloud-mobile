import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { AjoGroupSummary } from '@/api/endpoints/ajo-groups';
import type { CurrentUser } from '@/api/endpoints/users';
import type { Wallet } from '@/api/endpoints/wallets';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';

type HomeScreenProps = {
  user?: CurrentUser;
  wallets?: Wallet[];
  groups?: AjoGroupSummary[];
  loading: boolean;
  error: boolean;
  balanceVisible: boolean;
  onToggleBalance: () => void;
  onRetry: () => void;
  onOpenAjo: () => void;
  onOpenAkawo: () => void;
};

export function HomeScreen(props: HomeScreenProps) {
  const { colors } = useTheme();
  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
        ? 'Good afternoon'
        : 'Good evening';
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={undefined}
    >
      <View>
        <AppText style={{ color: colors.textMuted }}>{greeting}</AppText>
        <AppText accessibilityRole="header" weight="bold" style={styles.heading}>
          {props.user
            ? `${props.user.profile.firstName} ${props.user.profile.lastName}`
            : 'Ajo Cloud member'}
        </AppText>
      </View>

      {props.error ? (
        <View style={[styles.notice, { backgroundColor: colors.errorSoft }]}>
          <AppText weight="semibold" style={{ color: colors.error }}>
            Dashboard unavailable
          </AppText>
          <AppText style={{ color: colors.textMuted }}>
            Your account information could not be refreshed.
          </AppText>
          <AppButton label="Try again" variant="outline" onPress={props.onRetry} />
        </View>
      ) : null}

      <View
        accessible
        accessibilityLabel="Main wallet summary"
        style={[styles.wallet, { backgroundColor: colors.primary }]}
      >
        <View style={styles.rowBetween}>
          <AppText weight="semibold" style={styles.walletLabel}>
            MAIN WALLET
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              props.balanceVisible ? 'Hide wallet balance' : 'Show wallet balance'
            }
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
        <AppText weight="bold" style={styles.balance}>
          {props.balanceVisible ? 'Balance unavailable' : '••••••••'}
        </AppText>
        <AppText style={styles.walletMeta}>
          {props.loading
            ? 'Loading wallet…'
            : `${props.wallets?.length ?? 0} wallet account${props.wallets?.length === 1 ? '' : 's'}`}
        </AppText>
        <View style={styles.actions}>
          {['Fund', 'Send', 'Withdraw', 'History'].map((label) => (
            <View
              key={label}
              accessible
              accessibilityLabel={`${label} wallet, unavailable`}
              style={styles.action}
            >
              <Ionicons name="lock-closed-outline" color={colors.textInverse} size={16} />
              <AppText weight="medium" style={styles.actionText}>
                {label}
              </AppText>
            </View>
          ))}
        </View>
        <AppText style={styles.walletFootnote}>
          Actions unlock when the corresponding payment APIs are available.
        </AppText>
      </View>

      <Section title="Upcoming Activity">
        <EmptyCard text="No authoritative upcoming contribution or payout feed is available yet." />
      </Section>

      <Section title="My Ajo Groups" action="See all" onAction={props.onOpenAjo}>
        {props.groups?.length ? (
          props.groups.slice(0, 2).map((group) => (
            <View
              key={group.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.border },
              ]}
            >
              <View style={styles.rowBetween}>
                <AppText weight="semibold">{group.name}</AppText>
                <AppText style={{ color: colors.primary }}>{group.status}</AppText>
              </View>
              <AppText style={{ color: colors.textMuted }}>
                {group._count.members} members · {group.contributionFrequency.toLowerCase()}
              </AppText>
            </View>
          ))
        ) : (
          <EmptyCard text="You have not joined an Ajo group yet." />
        )}
      </Section>

      <Section title="Akawo Goals" action="See all" onAction={props.onOpenAkawo}>
        <EmptyCard text="Akawo goal services are not available yet. Your savings will appear here once enabled." />
      </Section>
    </ScrollView>
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
          <Pressable accessibilityRole="button" onPress={onAction} style={styles.sectionAction}>
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

function EmptyCard({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
    >
      <AppText style={{ color: colors.textMuted }}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl },
  heading: { fontSize: fontSizes.title },
  notice: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.md },
  wallet: { borderRadius: radius.lg, gap: spacing.md, overflow: 'hidden', padding: spacing.lg },
  walletLabel: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.caption, letterSpacing: 1.2 },
  balance: { color: '#FFFFFF', fontSize: fontSizes.heading },
  walletMeta: { color: 'rgba(255,255,255,0.72)' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    flex: 1,
    gap: spacing.xs,
    minHeight: sizes.touchTarget,
    padding: spacing.sm,
  },
  actionText: { color: '#FFFFFF', fontSize: fontSizes.caption },
  walletFootnote: { color: 'rgba(255,255,255,0.72)', fontSize: fontSizes.caption },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.body },
  sectionAction: {
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.sm,
  },
  card: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  rowBetween: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
});
