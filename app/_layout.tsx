import { useEffect } from 'react';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
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

    if (!token) {
      router.replace('/(auth)/');
      return;
    }

    // Authenticated — check if they've completed birth data onboarding.
    AsyncStorage.getItem(PROFILE_KEY).then((profile) => {
      if (!profile) {
        router.replace('/(auth)/onboarding');
      } else {
        router.replace('/(app)/');
        // (app)/_layout.tsx handles the subscription gate from here.
      }
    });
  }, [navState?.key, hydrated, fontsLoaded, fontError, token]);

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
