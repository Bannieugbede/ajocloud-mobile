import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { fontFamilies } from '@/theme';

type AppTextProps = TextProps & {
  weight?: keyof typeof fontFamilies;
};

export function AppText({ style, weight = 'regular', ...props }: AppTextProps) {
  const { colors } = useTheme();
  return (
    <Text {...props} style={[{ color: colors.text, fontFamily: fontFamilies[weight] }, style]} />
  );
}
