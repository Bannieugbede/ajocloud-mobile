import { StyleSheet, View } from 'react-native';

import type { AkawoPoolMember } from '@/api/endpoints/akawo-pools';
import { AppAmount } from '@/components/ui/app-amount';
import { AppAvatar } from '@/components/ui/app-avatar';
import { AppBadge } from '@/components/ui/app-badge';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, spacing } from '@/theme';
import { formatMinorAmount } from '@/utils/money';

import { dueLabel, dueTone, paidAmountMinor, paidAtLabel } from './pool-status';

/**
 * One person in the organiser's record: who they are, how the organiser will
 * recognise them, what has landed, and when.
 *
 * The whole row is one accessible element. Read as separate fragments a member
 * becomes "Ngozi Eze", "CSC/2021/017", "₦5,000", "Paid" — four stops that a
 * screen-reader user has to reassemble, and easy to misattribute to the
 * neighbouring row.
 */
export function PoolMemberRow({
  member,
  currency,
  isSelf = false,
  trailing,
}: {
  member: AkawoPoolMember;
  currency: string;
  /** Marks the signed-in member's own row, as "(You)". */
  isSelf?: boolean;
  /** Organiser controls, e.g. waive and remove. */
  trailing?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const status = dueLabel(member.due);
  const amountMinor = paidAmountMinor(member.due);
  const paidAt = paidAtLabel(member.due);
  const name = isSelf ? `${member.fullName} (You)` : member.fullName;

  const description = [member.reference, paidAt].filter(Boolean).join('\n');

  return (
    <View
      accessible
      accessibilityLabel={`${name}, ${member.reference}, ${formatMinorAmount(
        amountMinor,
        currency,
      )}, ${status}${paidAt ? `, paid ${paidAt}` : ''}`}
      style={styles.row}
    >
      <AppAvatar name={member.fullName} size={40} tone={isSelf ? 'solid' : 'soft'} />

      <View style={styles.text}>
        <AppText weight="semibold" numberOfLines={1} style={isSelf && { color: colors.primary }}>
          {name}
        </AppText>
        {description ? (
          <AppText style={[styles.meta, { color: colors.textMuted }]}>{description}</AppText>
        ) : null}
      </View>

      <View style={styles.trailing}>
        <AppAmount amountMinor={amountMinor} currency={currency} />
        <AppBadge label={status} tone={dueTone(member.due)} />
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  text: { flex: 1, gap: 2 },
  meta: { fontSize: fontSizes.caption },
  trailing: { alignItems: 'flex-end', gap: spacing.xs },
});
