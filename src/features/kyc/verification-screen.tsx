import Ionicons from '@expo/vector-icons/Ionicons';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import type { KycRequirement, KycRequirementKey, KycStage, KycStatus } from '@/api/endpoints/kyc';
import { AppBadge, type BadgeTone } from '@/components/ui/app-badge';
import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppProgress } from '@/components/ui/app-progress';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, spacing } from '@/theme';

import { stageStatusLabel } from './kyc-stages';

const STATUS_TONES: Record<KycStage['status'], BadgeTone> = {
  complete: 'success',
  in_progress: 'info',
  under_review: 'warning',
  locked: 'neutral',
};

const REQUIREMENT_ICONS: Record<
  KycRequirement['state'],
  React.ComponentProps<typeof Ionicons>['name']
> = {
  complete: 'checkmark-circle',
  pending: 'time-outline',
  failed: 'alert-circle',
  missing: 'ellipse-outline',
};

const REQUIREMENT_STATES: Record<KycRequirement['state'], string> = {
  complete: 'done',
  pending: 'being reviewed',
  failed: 'needs another try',
  missing: 'to do',
};

/** Requirements the member can act on from here. Sign-up itself is not one. */
const ACTIONABLE: ReadonlySet<KycRequirementKey> = new Set([
  'basicInfo',
  'pin',
  'nin',
  'ninDocument',
  'address',
]);

/** The next thing to do in a stage, or null if it is done or waiting. */
export function nextRequirement(stage: KycStage): KycRequirement | null {
  if (stage.status !== 'in_progress') return null;
  return (
    stage.requirements.find(
      (item) => ACTIONABLE.has(item.key) && (item.state === 'missing' || item.state === 'failed'),
    ) ?? null
  );
}

const ACTION_LABELS: Record<KycRequirementKey, string> = {
  account: 'Verify your email',
  basicInfo: 'Add basic details',
  pin: 'Set transaction PIN',
  nin: 'Verify NIN',
  ninDocument: 'Upload NIN document',
  address: 'Confirm address',
};

/**
 * The member's three verification stages, each with what it needs, where
 * they stand, and what it unlocks, so the stage they are in is never a guess.
 */
export function VerificationScreen({
  status,
  refreshing,
  onRefresh,
  onOpen,
}: {
  status: KycStatus;
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (requirement: KycRequirementKey) => void;
}) {
  const { colors } = useTheme();
  const level = status.level ?? 0;
  const stages = status.stages ?? [];
  const headline =
    status.currentStage === null
      ? 'You are fully verified'
      : `You are on stage ${status.currentStage} of 3`;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.container}
      style={{ backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      testID="verification-screen"
    >
      <AppCard>
        <View style={styles.summary}>
          <AppText weight="bold" style={styles.headline} accessibilityRole="header">
            {headline}
          </AppText>
          <AppText style={{ color: colors.textMuted }}>{level} of 3 stages complete</AppText>
          <AppProgress
            progressBps={Math.round((level / 3) * 10_000)}
            label="Verification progress"
            showValue={false}
            tone="success"
          />
          {status.restricted ? (
            <AppText style={{ color: colors.error }}>
              Your verification was not approved. Contact support to continue.
            </AppText>
          ) : null}
        </View>
      </AppCard>

      {stages.map((stage) => {
        const next = status.restricted ? null : nextRequirement(stage);
        return (
          <AppCard key={stage.stage} testID={`kyc-stage-${stage.stage}`}>
            <View style={styles.stage}>
              <View style={styles.stageHeader}>
                <AppText weight="semibold" style={styles.stageTitle}>
                  Stage {stage.stage} · {stage.title}
                </AppText>
                <AppBadge
                  label={stageStatusLabel(stage.status)}
                  tone={STATUS_TONES[stage.status]}
                />
              </View>

              <View style={styles.list}>
                {stage.requirements.map((item) => (
                  <View
                    key={item.key}
                    style={styles.row}
                    accessible
                    accessibilityLabel={`${item.label}, ${REQUIREMENT_STATES[item.state]}`}
                  >
                    <Ionicons
                      name={REQUIREMENT_ICONS[item.state]}
                      size={20}
                      color={
                        item.state === 'complete'
                          ? colors.success
                          : item.state === 'failed'
                            ? colors.error
                            : colors.textMuted
                      }
                    />
                    <AppText style={styles.rowText}>{item.label}</AppText>
                  </View>
                ))}
              </View>

              <View style={[styles.unlocks, { backgroundColor: colors.primarySoft }]}>
                <AppText weight="semibold" style={[styles.unlocksTitle, { color: colors.primary }]}>
                  Unlocks
                </AppText>
                {stage.unlocks.map((line) => (
                  <AppText key={line} style={[styles.unlocksText, { color: colors.primary }]}>
                    • {line}
                  </AppText>
                ))}
              </View>

              {stage.status === 'under_review' ? (
                <AppText style={{ color: colors.textMuted }}>
                  We are reviewing what you sent and will let you know.
                </AppText>
              ) : null}

              {next ? (
                <AppButton
                  label={ACTION_LABELS[next.key]}
                  onPress={() => onOpen(next.key)}
                  testID={`kyc-open-${next.key}`}
                />
              ) : null}
            </View>
          </AppCard>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xl },
  summary: { gap: spacing.sm },
  headline: { fontSize: fontSizes.title },
  stage: { gap: spacing.md },
  stageHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  stageTitle: { flex: 1, fontSize: fontSizes.body },
  list: { gap: spacing.sm },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  rowText: { flex: 1 },
  unlocks: { borderRadius: radius.md, gap: spacing.xs, padding: spacing.md },
  unlocksTitle: { fontSize: fontSizes.caption },
  unlocksText: { fontSize: fontSizes.caption },
});
