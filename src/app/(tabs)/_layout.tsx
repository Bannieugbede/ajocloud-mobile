import { Tabs } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, sizes } from '@/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerBackground },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fontFamilies.semibold },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontFamily: fontFamilies.medium },
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.divider,
          minHeight: sizes.touchTarget + 12,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Account', tabBarLabel: 'Account' }} />
    </Tabs>
  );
}
