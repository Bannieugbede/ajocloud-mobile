import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { fontSizes, radius, sizes, spacing } from '@/theme';
import type { AppError } from '@/types/errors';

import { FAQS } from './support-faqs';

const MIN_MESSAGE = 10;

export function SupportScreen({
  submitting,
  error,
  sent,
  supportAddress,
  onSubmit,
  onStartAnother,
  onEmailSupport,
}: {
  submitting: boolean;
  error?: AppError | null;
  sent: boolean;
  /** The address support replies from, or null when none is configured. */
  supportAddress?: string | null;
  onSubmit: (input: { subject: string; message: string }) => void;
  onStartAnother: () => void;
  onEmailSupport: () => void;
}) {
  const { colors } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const subjectValid = subject.trim().length >= 3;
  const messageValid = message.trim().length >= MIN_MESSAGE;

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
        <View style={styles.channels}>
          {/* Deliberately not labelled "Live Chat": messages are answered by
              email, and promising a reply time we do not measure would be a
              promise the product cannot keep. */}
          <ChannelTile
            icon="mail-outline"
            title="Message us"
            detail="We reply by email"
            tone="primary"
          />
          <ChannelTile
            icon="mail-open-outline"
            title="Email support"
            detail={supportAddress ?? 'Not configured'}
            tone="secondary"
            onPress={supportAddress ? onEmailSupport : undefined}
          />
        </View>

        {sent ? (
          <AppCard>
            <View style={styles.sentHead}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.success}
                accessibilityElementsHidden
                importantForAccessibility="no"
              />
              <AppText accessibilityRole="header" weight="semibold">
                Thanks — we have your message
              </AppText>
            </View>
            <AppText style={{ color: colors.textMuted }}>
              Support will reply to the email address on your account.
            </AppText>
            <AppButton label="Send another" variant="outline" onPress={onStartAnother} />
          </AppCard>
        ) : (
          <>
            <AppText weight="semibold" style={[styles.section, { color: colors.textMuted }]}>
              SEND A MESSAGE
            </AppText>

            <AppInput
              label="Subject"
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. A payment did not arrive"
              autoCapitalize="sentences"
              error={touched && !subjectValid ? 'Give your message a short subject.' : undefined}
            />

            <AppInput
              label="Message"
              value={message}
              onChangeText={setMessage}
              placeholder="Describe your issue or question…"
              autoCapitalize="sentences"
              multiline
              numberOfLines={6}
              maxLength={5000}
              style={styles.message}
              error={
                touched && !messageValid
                  ? `Please write at least ${MIN_MESSAGE} characters so we can help.`
                  : undefined
              }
            />

            {error ? (
              <AppText style={{ color: colors.error }} accessibilityLiveRegion="polite">
                {error.message}
              </AppText>
            ) : null}

            <AppButton
              label="Send Message"
              onPress={() => {
                if (!subjectValid || !messageValid) {
                  setTouched(true);
                  return;
                }
                onSubmit({ subject: subject.trim(), message: message.trim() });
              }}
              loading={submitting}
              disabled={submitting}
            />
          </>
        )}

        <AppText weight="semibold" style={[styles.section, { color: colors.textMuted }]}>
          FAQS
        </AppText>

        {FAQS.map((faq) => (
          <FaqRow
            key={faq.id}
            question={faq.question}
            answer={faq.answer}
            open={openFaq === faq.id}
            onToggle={() => setOpenFaq((current) => (current === faq.id ? null : faq.id))}
          />
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ChannelTile({
  icon,
  title,
  detail,
  tone,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  detail: string;
  tone: 'primary' | 'secondary';
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const foreground = tone === 'primary' ? colors.success : colors.primary;
  const background = tone === 'primary' ? colors.successSoft : colors.primarySoft;

  const body = (
    <>
      <View style={[styles.channelIcon, { backgroundColor: background }]}>
        <Ionicons
          name={icon}
          size={22}
          color={foreground}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
      <AppText weight="semibold">{title}</AppText>
      <AppText numberOfLines={1} style={[styles.channelDetail, { color: colors.textMuted }]}>
        {detail}
      </AppText>
    </>
  );

  if (!onPress) {
    return (
      <View
        accessible
        accessibilityLabel={`${title}. ${detail}`}
        style={[styles.channel, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.channel,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      {body}
    </Pressable>
  );
}

/**
 * One question, expanding in place.
 *
 * An accordion rather than a pushed screen: the answers are two or three
 * sentences, and pushing a screen for each would mean navigating back and forth
 * to compare two of them.
 */
function FaqRow({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={question}
      accessibilityHint={open ? 'Collapses the answer' : 'Shows the answer'}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.faq,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.faqHead}>
        <AppText weight="semibold" style={styles.faqQuestion}>
          {question}
        </AppText>
        <Ionicons
          name={open ? 'chevron-down' : 'chevron-forward'}
          size={18}
          color={colors.textMuted}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
      {open ? <AppText style={{ color: colors.textMuted }}>{answer}</AppText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.xxl },
  channels: { flexDirection: 'row', gap: spacing.sm },
  channel: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    minHeight: sizes.touchTarget,
    padding: spacing.md,
  },
  channelIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.xs,
    width: 44,
  },
  channelDetail: { fontSize: fontSizes.caption },

  section: { fontSize: fontSizes.caption, letterSpacing: 1, marginTop: spacing.sm },
  message: { minHeight: 120, textAlignVertical: 'top' },
  sentHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },

  faq: {
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: sizes.touchTarget,
    padding: spacing.md,
  },
  faqHead: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  faqQuestion: { flex: 1 },
});
