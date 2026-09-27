import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppKeyboardScrollView } from '@/components/ui/app-keyboard';

import type { GroupInvitePreview } from '@/api/endpoints/ajo-groups';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppStepProgress } from '@/components/ui/app-step-progress';
import { AppStepper } from '@/components/ui/app-stepper';
import { AppText } from '@/components/ui/app-text';
import { AppToggleRow } from '@/components/ui/app-toggle-row';
import { useErrorToast } from '@/hooks/use-toast-on-change';
import { useTheme } from '@/hooks/use-theme';
import { invitationCodeFromUrl, normaliseGroupCode } from '@/services/incoming-link';
import { fontSizes, radius, spacing } from '@/theme';
import type { AppError } from '@/types/errors';
import { formatMinorAmount } from '@/utils/money';

import { frequencyLabel } from './invite-landing-screen';

export type ResolvedGroup = {
  groupId: string;
  groupName: string;
  /** Public invitation details for the confirm step. Null when unavailable. */
  preview?: GroupInvitePreview | null;
};

const JOIN_STEPS = ['code', 'confirm'] as const;

/**
 * The code in what was typed or pasted, in the form the API reads it.
 *
 * Members usually paste the whole invitation the admin shared — the message
 * with its link — rather than the bare code, so a link or a "code: X" line
 * inside pasted text resolves to its code. Anything else must look like a
 * code on its own. The capture is validated, never trusted: a wrong shape
 * still fails rather than spending a request.
 */
function extractCode(input: string): string | null {
  const trimmed = input.trim();
  const direct = normaliseGroupCode(trimmed);
  if (direct) return direct;
  const fromUrl = invitationCodeFromUrl(trimmed);
  if (fromUrl) return fromUrl;
  const embedded = trimmed.match(/(?:\/g\/|code:\s*)([A-Za-z0-9_-]{7,128})/i);
  return embedded?.[1] ? normaliseGroupCode(embedded[1]) : null;
}

/**
 * Joining a rotation with a code, one decision at a time.
 *
 * Two steps like the create flow: the code is verified first, so the member
 * sees which group they are about to join before committing to it — a code
 * read aloud or forwarded is easy to get wrong, and joining the wrong rotation
 * is a commitment of real money. Only once a group is named does the screen
 * ask how many positions to take.
 */
export function JoinGroupScreen({
  submitting,
  verifying,
  loadingPreview = false,
  error,
  resolved,
  initialInvitationCode = '',
  codeLocked = false,
  onVerify,
  onSubmit,
}: {
  submitting: boolean;
  verifying: boolean;
  /** The group preview is still loading for the confirm step. */
  loadingPreview?: boolean;
  error?: AppError | null;
  /** The group the code admits, once verified. Null until then. */
  resolved?: ResolvedGroup | null;
  /** Prefilled when the screen was reached from an invitation link. */
  initialInvitationCode?: string;
  /** The code arrived with the route and cannot be changed. Skips step one. */
  codeLocked?: boolean;
  onVerify: (code: string) => void;
  onSubmit: (input: { groupId: string; invitationCode: string; requestedSlots: number }) => void;
}) {
  const { colors } = useTheme();
  useErrorToast(error?.message);
  const [code, setCode] = useState(initialInvitationCode);
  const [slots, setSlots] = useState('1');
  const [multiple, setMultiple] = useState(false);
  const [touched, setTouched] = useState(false);
  const [stepIndex, setStepIndex] = useState(resolved ? 1 : 0);
  // The code that produced the current resolution, so going back and
  // continuing with an unchanged code does not spend a second request.
  const [submittedCode, setSubmittedCode] = useState<string | null>(initialInvitationCode || null);

  // A fresh resolution always opens its confirm step; going back stays until
  // a new group resolves. Details arriving late must not move the member.
  const resolvedId = resolved?.groupId ?? null;
  const seenId = useRef<string | null>(null);
  useEffect(() => {
    if (resolvedId !== seenId.current) {
      seenId.current = resolvedId;
      setStepIndex(resolvedId ? 1 : 0);
    }
  }, [resolved, resolvedId]);

  const trimmed = code.trim();
  // Canonical, so a short code typed in lower case or with a dash is the same
  // code, and a pasted invitation resolves to the code inside it. Invitations
  // issued before short links are longer and case-sensitive, and are kept
  // exactly.
  const canonical = extractCode(trimmed);
  const codeValid = canonical !== null;
  const slotsValue = /^\d+$/.test(slots.trim()) ? Number(slots.trim()) : 0;

  const verifyNow = () => {
    if (!codeValid) {
      setTouched(true);
      return;
    }
    const next = canonical ?? trimmed;
    // Already verified: the confirm step is one tap away, not one request.
    if (resolved && submittedCode !== null && next === submittedCode) {
      setStepIndex(1);
      return;
    }
    setSubmittedCode(next);
    onVerify(next);
  };

  return (
    <AppKeyboardScrollView
      style={styles.flex}
      contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <AppStepProgress total={JOIN_STEPS.length} current={stepIndex + 1} />

      {stepIndex === 0 ? (
        <>
          <View style={styles.hero}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={[styles.medallion, { backgroundColor: colors.primarySoft }]}
            >
              <Ionicons name="person-add-outline" size={22} color={colors.primary} />
            </View>

            <View style={styles.heroText}>
              <AppText weight="bold" style={styles.heading}>
                Join with a code
              </AppText>
              <AppText style={{ color: colors.textMuted }}>
                Enter the invitation code from your group admin to check the group and join.
              </AppText>
            </View>
          </View>

          <AppInput
            label="Invitation code"
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setTouched(false);
            }}
            placeholder="e.g. 7KQ3MZP2AC"
            autoCapitalize="none"
            autoCorrect={false}
            // Autocorrect would break a code. Capitalisation is left alone because
            // invitations from before short links are case-sensitive.
            spellCheck={false}
            error={
              touched && !codeValid
                ? 'That doesn’t look like an invitation code. Check it and try again.'
                : undefined
            }
          />

          <AppButton
            label="Verify code"
            onPress={verifyNow}
            loading={verifying}
            // Never disabled for a bad-looking code: the button is what says
            // so, via the field error. A button that goes dead without
            // explanation reads as broken.
            disabled={verifying}
          />
        </>
      ) : null}

      {stepIndex === 1 && resolved ? (
        <>
          <ConfirmSummary
            groupName={resolved.groupName}
            preview={resolved.preview ?? null}
            loadingPreview={loadingPreview}
          />

          <AppToggleRow
            title="Take more than one position"
            description="Hold several positions in the rotation"
            value={multiple}
            onValueChange={(next) => {
              setMultiple(next);
              if (!next) setSlots('1');
            }}
          />

          {multiple ? (
            <AppStepper
              label="Positions you want"
              value={slots}
              unit="positions"
              hint="The admin may cap how many one member can hold."
              onDecrement={() => setSlots(String(Math.max(1, slotsValue - 1)))}
              onIncrement={() => setSlots(String(slotsValue + 1))}
              canDecrement={slotsValue > 1}
            />
          ) : null}

          <View style={styles.actions}>
            {codeLocked ? null : (
              <AppButton
                label="Back"
                variant="outline"
                onPress={() => setStepIndex(0)}
                style={styles.action}
              />
            )}
            <AppButton
              label="Join group"
              onPress={() =>
                onSubmit({
                  groupId: resolved.groupId,
                  invitationCode: canonical ?? trimmed,
                  requestedSlots: Math.max(1, slotsValue),
                })
              }
              loading={submitting}
              disabled={submitting}
              style={styles.action}
            />
          </View>
        </>
      ) : null}
    </AppKeyboardScrollView>
  );
}

/**
 * The group about to be joined, stated before any commitment.
 *
 * The public invitation details name the contribution, the cadence and how
 * full the group is — the three facts that decide whether joining is right.
 * When they are unavailable the name alone still shows; joining never waits on
 * decoration.
 */
function ConfirmSummary({
  groupName,
  preview,
  loadingPreview,
}: {
  groupName: string;
  preview: GroupInvitePreview | null;
  loadingPreview: boolean;
}) {
  const { colors } = useTheme();
  const spotsLeft = preview ? Math.max(0, preview.maxMembers - preview.memberCount) : null;

  return (
    <View style={styles.review}>
      <View style={[styles.summary, { backgroundColor: colors.primary }]}>
        <AppText weight="semibold" style={styles.summaryEyebrow}>
          YOU ARE JOINING
        </AppText>
        {groupName ? (
          <AppText weight="bold" style={styles.summaryName} numberOfLines={2}>
            {groupName}
          </AppText>
        ) : (
          <AppText style={styles.summaryName}>
            {loadingPreview ? 'Finding your group…' : 'Your group'}
          </AppText>
        )}
        {preview ? (
          <View style={styles.tags}>
            <Tag>{frequencyLabel(preview.contributionFrequency)}</Tag>
            <Tag>
              {preview.memberCount} of {preview.maxMembers} joined
            </Tag>
          </View>
        ) : null}
      </View>

      {preview ? (
        <AppCard style={styles.details}>
          <Detail
            label="Contribution"
            value={`${formatMinorAmount(preview.contributionAmountMinor, preview.currency)} ${frequencyLabel(
              preview.contributionFrequency,
            )}`}
          />
          <Detail
            label="Members"
            value={
              spotsLeft !== null && spotsLeft > 0
                ? `${preview.memberCount} joined · ${spotsLeft} ${
                    spotsLeft === 1 ? 'spot' : 'spots'
                  } left`
                : `${preview.memberCount} joined`
            }
          />
          <Detail label="Invited by" value={preview.inviterName} />
        </AppCard>
      ) : null}

      {preview?.description ? (
        <AppText style={{ color: colors.textMuted }}>{preview.description}</AppText>
      ) : null}

      <AppText style={{ color: colors.textMuted }}>
        Nothing is collected until the rotation starts. You choose how many positions to take below.
      </AppText>
    </View>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.tag}>
      <AppText weight="semibold" style={styles.tagText}>
        {children}
      </AppText>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.detailRow}>
      <AppText style={{ color: colors.textMuted }}>{label}</AppText>
      <AppText weight="semibold" style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    // Tight to the navigator header: the progress is the first thing under it.
    paddingTop: spacing.xs,
  },

  medallion: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  hero: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  heroText: { flex: 1, gap: 2 },
  heading: { fontSize: fontSizes.title },

  review: { gap: spacing.sm },
  summary: { borderRadius: radius.lg, gap: spacing.sm, padding: spacing.lg },
  summaryEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: fontSizes.caption,
    letterSpacing: 1,
  },
  summaryName: { color: '#FFFFFF', fontSize: fontSizes.heading },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  tagText: { color: '#FFFFFF', fontSize: fontSizes.caption },

  details: { gap: spacing.sm },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  detailValue: { flexShrink: 1, textAlign: 'right' },

  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  action: { flex: 1 },
});
