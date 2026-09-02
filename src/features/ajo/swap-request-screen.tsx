import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import type { AjoGroupDetail } from '@/api/endpoints/ajo-groups';
import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppSelect } from '@/components/ui/app-select';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { spacing } from '@/theme';
import type { AppError } from '@/types/errors';

/**
 * Positions the viewer can offer, and positions they can ask for.
 *
 * A swap trades one of your own positions for someone else's, so the two lists
 * are disjoint: offering a position you do not hold, or asking for one you
 * already have, are both meaningless.
 */
export function splitSlots(
  group: Pick<AjoGroupDetail, 'slots' | 'members'>,
  viewerUserId: string | null,
) {
  const memberById = new Map(group.members.map((member) => [member.id, member]));
  const mine: typeof group.slots = [];
  const theirs: typeof group.slots = [];
  for (const slot of group.slots) {
    const member = memberById.get(slot.memberId);
    if (viewerUserId && member?.userId === viewerUserId) mine.push(slot);
    else theirs.push(slot);
  }
  return { mine, theirs, memberById };
}

export function SwapRequestScreen({
  group,
  viewerUserId,
  submitting,
  error,
  onSubmit,
}: {
  group: AjoGroupDetail;
  viewerUserId: string | null;
  submitting: boolean;
  error?: AppError | null;
  onSubmit: (input: { fromSlotId: string; toSlotId: string; reason?: string }) => void;
}) {
  const { colors } = useTheme();
  const { mine, theirs, memberById } = splitSlots(group, viewerUserId);

  const [fromSlotId, setFromSlotId] = useState<string | null>(mine[0]?.id ?? null);
  const [toSlotId, setToSlotId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const label = (slot: { id: string; memberId: string; position: number }) => {
    const holder = memberById.get(slot.memberId)?.displayName ?? 'Member';
    return `Round ${slot.position} · ${holder}`;
  };

  const canSubmit = Boolean(fromSlotId && toSlotId && fromSlotId !== toSlotId) && !submitting;

  if (mine.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      >
        <AppText style={{ color: colors.textMuted }}>
          You do not hold a position in this rotation, so there is nothing to swap.
        </AppText>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <AppText style={{ color: colors.textMuted }}>
          Everyone affected has to agree before positions change, so this is a request rather than a
          swap.
        </AppText>

        <AppSelect
          label="Your position"
          value={fromSlotId}
          options={mine.map((slot) => ({ value: slot.id, label: label(slot) }))}
          onChange={setFromSlotId}
        />

        <AppSelect
          label="Position you want"
          value={toSlotId}
          options={theirs.map((slot) => ({ value: slot.id, label: label(slot) }))}
          onChange={setToSlotId}
          placeholder="Choose a position"
          searchable={theirs.length > 8}
        />

        <AppInput
          label="Why? (optional)"
          value={reason}
          onChangeText={setReason}
          placeholder="This helps the other member decide"
          autoCapitalize="sentences"
          multiline
        />

        {error ? (
          <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
            {error.message}
          </AppText>
        ) : null}

        <AppButton
          label="Send request"
          onPress={() => {
            if (!fromSlotId || !toSlotId) return;
            const trimmed = reason.trim();
            onSubmit({
              fromSlotId,
              toSlotId,
              // Omitted rather than sent blank: the backend requires at least 3
              // characters when the field is present.
              ...(trimmed.length >= 3 ? { reason: trimmed } : {}),
            });
          }}
          loading={submitting}
          disabled={!canSubmit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, gap: spacing.md, padding: spacing.lg },
  flex: { flex: 1 },
});
