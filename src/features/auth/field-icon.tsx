import Ionicons from '@expo/vector-icons/Ionicons';

import { useTheme } from '@/hooks/use-theme';

/** Leading icons for auth fields, kept in one place so screens stay consistent. */
export type FieldIconName = 'person' | 'mail' | 'lock' | 'code' | 'phone' | 'gift';

const GLYPHS: Record<FieldIconName, keyof typeof Ionicons.glyphMap> = {
  person: 'person-outline',
  mail: 'mail-outline',
  lock: 'lock-closed-outline',
  code: 'keypad-outline',
  phone: 'call-outline',
  gift: 'gift-outline',
};

/**
 * Decorative only: the input's own label names the field, so the icon is hidden
 * from assistive technology by the slot that renders it.
 */
export function FieldIcon({ name }: { name: FieldIconName }) {
  const { colors } = useTheme();
  return <Ionicons name={GLYPHS[name]} size={18} color={colors.textSubtle} />;
}
