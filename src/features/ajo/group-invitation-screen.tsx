import { Share, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

/**
 * Shown once, immediately after a group is created.
 *
 * The invitation code exists only in the create response — the backend stores a
 * digest and cannot return it again — so this screen must make copying and
 * sharing it easy before the administrator navigates away. Joining also needs
 * the group id, so both are shared together.
 */
export function GroupInvitationScreen({
  groupName,
  groupId,
  invitationCode,
  onDone,
}: {
  groupName: string;
  groupId: string;
  invitationCode: string;
  onDone: () => void;
}) {
  const { colors } = useTheme();

  const invitation = `Join "${groupName}" on Ajo Cloud.\nGroup ID: ${groupId}\nInvitation code: ${invitationCode}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.badge, { backgroundColor: colors.successSoft }]}>
          <Ionicons
            name="checkmark-circle"
            size={32}
            color={colors.success}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>

        <AppText accessibilityRole="header" weight="bold" style={styles.title}>
          {groupName} is ready
        </AppText>

        <AppText style={[styles.lead, { color: colors.textMuted }]}>
          Share this invitation with the people joining. You will not be able to see the code again
          once you leave this screen.
        </AppText>

        <AppCard>
          <AppText style={{ color: colors.textMuted }}>Group ID</AppText>
          <AppText weight="semibold" style={styles.mono} selectable>
            {groupId}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>Invitation code</AppText>
          <AppText weight="bold" style={styles.mono} selectable>
            {invitationCode}
          </AppText>
        </AppCard>
      </View>

      <View style={styles.actions}>
        <AppButton
          label="Share invitation"
          onPress={() => {
            void Share.share({ message: invitation });
          }}
        />
        <AppButton
          label="Copy invitation"
          variant="outline"
          onPress={() => {
            void Clipboard.setStringAsync(invitation);
          }}
        />
        <AppButton label="Done" variant="ghost" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm, padding: spacing.lg },
  badge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  container: { flex: 1, justifyContent: 'space-between' },
  content: { alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  lead: { textAlign: 'center' },
  mono: { fontSize: fontSizes.body },
  title: { fontSize: fontSizes.title, textAlign: 'center' },
});
