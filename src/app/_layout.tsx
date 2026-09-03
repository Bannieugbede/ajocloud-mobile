import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { useIncomingInvitation } from '@/hooks/use-incoming-invitation';
import { useNotificationNavigation } from '@/hooks/use-notification-navigation';
import { useTheme } from '@/hooks/use-theme';
import { useThemedStackOptions } from '@/hooks/use-themed-stack-options';
import { AppBootstrap } from '@/providers/app-bootstrap';
import { AppProviders } from '@/providers/app-providers';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <AppErrorBoundary>
      <AppBootstrap>
        <AppProviders>
          <ThemedNavigation />
        </AppProviders>
      </AppBootstrap>
    </AppErrorBoundary>
  );
}

function ThemedNavigation() {
  const { colors, mode } = useTheme();
  const stackOptions = useThemedStackOptions();

  // Both live here rather than on a screen: a tapped notification or an
  // invitation link often launches the app from cold, so whatever handles them
  // has to be mounted before any particular screen is.
  useNotificationNavigation();
  useIncomingInvitation();

  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={stackOptions}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(public)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="join/[code]" options={{ title: 'Invitation' }} />
      </Stack>
    </>
  );
}
