import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/use-theme';
import { fontFamilies, sizes } from '@/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      initialRouteName="home"
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
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ajo"
        options={{
          title: 'Ajo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="basket-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="akawo"
        options={{
          title: 'Akawo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
