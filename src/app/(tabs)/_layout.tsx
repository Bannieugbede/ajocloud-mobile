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
        headerShown: false,
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
      {/* Bills is reached from the wallet's Bills action and the Pay Bills
          section on Home, which is where a person goes looking for it. Keeping
          it out of the bar holds the product tabs to five, so each keeps a
          comfortable target on a small phone. */}
      <Tabs.Screen name="bills" options={{ href: null, title: 'Bills' }} />
      {/* The payment flow is entered from a feature, never from the tab bar:
          without a payment in progress it has nothing to show. */}
      <Tabs.Screen name="pay" options={{ href: null }} />
      {/* Reached from Profile and from a notification tap. A seventh tab would
          crowd the bar without earning its place next to the products. */}
      {/* Draws its own header, like the tab roots; see the note in the Ajo layout. */}
      <Tabs.Screen
        name="notifications"
        options={{ href: null, title: 'Notifications', headerShown: false }}
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
