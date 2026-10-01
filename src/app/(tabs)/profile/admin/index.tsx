import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { listAjoGroups } from '@/api/endpoints/ajo-groups';
import { listCoordinatedFoodProgrammes } from '@/api/endpoints/food-ajo';
import { AppBadge } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppSegmented } from '@/components/ui/app-segmented';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/ui/app-state';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import { statusLabel } from '@/utils/status';

type GroupType = 'ajo' | 'food';

export default function GroupAdminHubRoute() {
  const { colors } = useTheme();
  const [type, setType] = useState<GroupType>('ajo');
  const ajo = useQuery({ queryKey: ['ajo-groups'], queryFn: listAjoGroups });
  const food = useInfiniteQuery({
    queryKey: ['food-programmes', 'COORDINATED'],
    queryFn: ({ pageParam }) => listCoordinatedFoodProgrammes(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return (
    <ScrollView contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}>
      <AppSegmented
        value={type}
        options={[
          { value: 'ajo', label: 'Ajo groups' },
          { value: 'food', label: 'Food groups' },
        ]}
        onChange={setType}
      />
      {type === 'ajo' ? (
        <>
          <AppButton
            label="Create Ajo group"
            icon="add-outline"
            onPress={() => router.push('/(tabs)/ajo/create')}
          />
          {ajo.isPending ? <AppLoadingState label="Loading groups" /> : null}
          {ajo.isError ? (
            <AppErrorState
              description="Could not load your groups."
              onRetry={() => void ajo.refetch()}
            />
          ) : null}
          {ajo.data
            ?.filter((group) => group.callerRole === 'GROUP_ADMIN')
            .map((group) => (
              <Pressable
                key={group.id}
                accessibilityRole="button"
                accessibilityLabel={`Manage ${group.name}`}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/profile/admin/ajo/[groupId]',
                    params: { groupId: group.id },
                  } as unknown as Href)
                }
              >
                <AppCard style={styles.card}>
                  <View style={styles.row}>
                    <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                      <Ionicons name="people-outline" size={21} color={colors.primary} />
                    </View>
                    <View style={styles.copy}>
                      <AppText weight="semibold">{group.name}</AppText>
                      <AppText style={{ color: colors.textMuted }}>
                        {group._count.members} members · {group._count.slots}/{group.maxSlots} slots
                      </AppText>
                    </View>
                    <AppBadge label={statusLabel(group.status)} tone="info" />
                  </View>
                </AppCard>
              </Pressable>
            ))}
          {ajo.data && !ajo.data.some((group) => group.callerRole === 'GROUP_ADMIN') ? (
            <AppEmptyState
              title="No Ajo groups to manage"
              description="Groups you administer will appear here."
            />
          ) : null}
        </>
      ) : (
        <>
          <AppButton
            label="Create food group"
            icon="add-outline"
            onPress={() => router.push('/(tabs)/profile/admin/food/create' as Href)}
          />
          {food.isPending ? <AppLoadingState label="Loading food groups" /> : null}
          {food.isError ? (
            <AppErrorState
              description="Could not load your food groups."
              onRetry={() => void food.refetch()}
            />
          ) : null}
          {food.data?.pages
            .flatMap((page) => page.items)
            .map((programme) => (
              <Pressable
                key={programme.id}
                accessibilityRole="button"
                accessibilityLabel={`Manage ${programme.name}`}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/profile/admin/food/[programmeId]',
                    params: { programmeId: programme.id },
                  } as unknown as Href)
                }
              >
                <AppCard style={styles.card}>
                  <View style={styles.row}>
                    <View style={[styles.icon, { backgroundColor: colors.secondarySoft }]}>
                      <Ionicons name="basket-outline" size={21} color={colors.secondary} />
                    </View>
                    <View style={styles.copy}>
                      <AppText weight="semibold">{programme.name}</AppText>
                      <AppText style={{ color: colors.textMuted }}>
                        {programme._count.subscriptions} enrolments · {programme.packages.length}{' '}
                        packages
                      </AppText>
                    </View>
                    <AppBadge label={statusLabel(programme.status)} tone="info" />
                  </View>
                </AppCard>
              </Pressable>
            ))}
          {food.data && food.data.pages.every((page) => page.items.length === 0) ? (
            <AppEmptyState
              title="No food groups to manage"
              description="Food groups you coordinate will appear here."
            />
          ) : null}
          {food.hasNextPage ? (
            <AppButton
              label="Load more"
              variant="outline"
              loading={food.isFetchingNextPage}
              onPress={() => void food.fetchNextPage()}
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  card: { marginVertical: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 4 },
});
