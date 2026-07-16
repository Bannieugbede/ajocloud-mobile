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

import { AppErrorBoundary } from '@/components/app-error-boundary';
import { useTheme } from '@/hooks/use-theme';
import { AppBootstrap } from '@/providers/app-bootstrap';
import { AppProviders } from '@/providers/app-providers';
import { fontFamilies } from '@/theme';

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
  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: colors.headerBackground },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fontFamilies.semibold },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(public)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
