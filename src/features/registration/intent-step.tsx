import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppButton } from '@/components/ui/app-button';
import { AppCheckbox } from '@/components/ui/app-checkbox';
import { AppText } from '@/components/ui/app-text';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';
import { StepScreen } from './step-screen';

/**
 * Static by design: these are the app's own destinations, not server data, so
 * they need no endpoint or configuration service.
 */
const INTENTS = [
  {
    id: 'join-ajo',
    icon: 'people-outline',
    title: 'Join an Ajo group',
    detail: 'Save together on a rotating schedule.',
  },
  {
    id: 'create-ajo',
    icon: 'add-circle-outline',
    title: 'Create an Ajo group',
    detail: 'Invite people you trust and set the terms.',
  },
  {
    id: 'join-food-ajo',
    icon: 'basket-outline',
    title: 'Join a food Ajo',
    detail: 'Contribute towards a food package.',
  },
  {
    id: 'create-akawo',
    icon: 'flag-outline',
    title: 'Create an Akawo goal',
    detail: 'Save towards something on your own terms.',
  },
  {
    id: 'explore',
    icon: 'compass-outline',
    title: 'Just explore the app',
    detail: 'Look around first and decide later.',
  },
] as const;

export type IntentId = (typeof INTENTS)[number]['id'];

export function IntentStep({ onContinue }: { onContinue: (selected: IntentId[]) => void }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<IntentId[]>([]);

  const toggle = (id: IntentId) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  return (
    <StepScreen
      step="intent"
      title="What would you like to do?"
      description="Pick anything that interests you. This just tailors what we show first — you can do all of it later."
    >
      <View style={styles.list}>
        {INTENTS.map((intent) => {
          const checked = selected.includes(intent.id);
          return (
            <AppCheckbox
              key={intent.id}
              checked={checked}
              onChange={() => toggle(intent.id)}
              label={`${intent.title}. ${intent.detail}`}
              testID={`intent-${intent.id}`}
              style={[
                styles.card,
                {
                  backgroundColor: checked ? colors.primarySoft : colors.surface,
                  borderColor: checked ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={styles.cardBody}>
                <Ionicons
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                  name={intent.icon}
                  size={22}
                  color={checked ? colors.primary : colors.textMuted}
                />
                <View style={styles.copy}>
                  <AppText weight="semibold">{intent.title}</AppText>
                  <AppText style={[styles.detail, { color: colors.textMuted }]}>
                    {intent.detail}
                  </AppText>
                </View>
              </View>
            </AppCheckbox>
          );
        })}
        <AppButton label="Continue" onPress={() => onContinue(selected)} testID="intent-continue" />
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardBody: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  detail: { lineHeight: 20 },
});
