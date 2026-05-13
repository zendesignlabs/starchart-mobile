import { useEffect } from 'react';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/store/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

SplashScreen.preventAutoHideAsync();

const PROFILE_KEY = '@starchart/profile';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  const { token, hydrated, hydrate } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const navState = useRootNavigationState();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && hydrated) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, hydrated]);

  useEffect(() => {
    if (!navState?.key) return;
    if (!hydrated) return;
    if (!fontsLoaded && !fontError) return;

    const routeSegments = segments as string[];
    const rootSegment = routeSegments[0];
    const leafSegment = routeSegments[1];
    const inAuthGroup = rootSegment === '(auth)';
    const inAppGroup = rootSegment === '(app)';
    const inOnboarding = inAuthGroup && leafSegment === 'onboarding';

    if (!token) {
      if (!inAuthGroup) router.replace('/(auth)/');
      return;
    }

    // Authenticated — check if they've completed birth data onboarding.
    AsyncStorage.getItem(PROFILE_KEY).then((profile) => {
      if (!profile) {
        if (!inOnboarding) router.replace('/(auth)/onboarding');
        return;
      }

      // Do not fight tab navigation inside (app), and do not override paywall/onboarding.
      if (!inAppGroup && !inOnboarding && !(inAuthGroup && leafSegment === 'paywall')) {
        router.replace('/(app)/');
      }
    });
  }, [navState?.key, hydrated, fontsLoaded, fontError, token, segments]);

  if ((!fontsLoaded && !fontError) || !hydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
