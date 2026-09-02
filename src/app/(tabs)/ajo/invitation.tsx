import { router, useLocalSearchParams } from 'expo-router';

import { GroupInvitationScreen } from '@/features/ajo/group-invitation-screen';

export default function AjoInvitationRoute() {
  const { groupId, groupName, invitationCode } = useLocalSearchParams<{
    groupId: string;
    groupName: string;
    invitationCode: string;
  }>();

  if (!groupId || !invitationCode) {
    // Reached without the create response, e.g. by a deep link. There is no way
    // to recover the code, so the list is the only honest destination.
    router.replace('/(tabs)/ajo');
    return null;
  }

  return (
    <GroupInvitationScreen
      groupId={groupId}
      groupName={groupName ?? 'Your group'}
      invitationCode={invitationCode}
      onDone={() => router.replace({ pathname: '/(tabs)/ajo/[groupId]', params: { groupId } })}
    />
  );
}
