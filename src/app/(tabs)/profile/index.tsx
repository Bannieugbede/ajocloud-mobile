import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { logout } from '@/api/endpoints/auth';
import { getCurrentUser } from '@/api/endpoints/users';
import { AppButton } from '@/components/ui/app-button';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { clearSession } from '@/services/session-storage';
import { fontSizes, radius, spacing } from '@/theme';

export default function ProfileRoute() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const user = useQuery({ queryKey: ['current-user'], queryFn: getCurrentUser, retry: 1 });
  const signOut = useMutation({
    mutationFn: async () => {
      try {
        await logout();
      } finally {
        await clearSession();
      }
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace('/(auth)/sign-in');
    },
  });
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
    >
      {user.isPending ? (
        <ActivityIndicator accessibilityLabel="Loading profile" color={colors.primary} />
      ) : null}
      {user.data ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.border },
          ]}
        >
          <AppText accessibilityRole="header" weight="bold" style={styles.title}>
            {user.data.profile.firstName} {user.data.profile.lastName}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>{user.data.email}</AppText>
          <AppText>Status: {user.data.status}</AppText>
          <AppButton
            label="Sign out"
            variant="outline"
            loading={signOut.isPending}
            onPress={() => signOut.mutate()}
          />
        </View>
      ) : null}
      {user.isError ? (
        <View style={[styles.card, { backgroundColor: colors.errorSoft }]}>
          <AppText style={{ color: colors.error }}>We could not load your profile.</AppText>
          <AppButton label="Try again" variant="outline" onPress={() => void user.refetch()} />
        </View>
      ) : null}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  card: { borderRadius: radius.lg, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  title: { fontSize: fontSizes.title },
});
