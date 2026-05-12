import { useEffect, useState } from 'react';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

SplashScreen.preventAutoHideAsync();

const STORAGE_KEY = '@starchart/profile';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_700Bold,
  });

  const [profileChecked, setProfileChecked] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const router = useRouter();
  const navState = useRootNavigationState();

  // Check AsyncStorage once on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      setHasProfile(value !== null);
      setProfileChecked(true);
    });
  }, []);

  // Hide splash once fonts + profile check are both done
  useEffect(() => {
    if ((fontsLoaded || fontError) && profileChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, profileChecked]);

  // Navigate once navigation is ready and we know the profile state
  useEffect(() => {
    if (!navState?.key) return;
    if (!profileChecked) return;
    if (!fontsLoaded && !fontError) return;

    if (hasProfile) {
      router.replace('/(app)/');
    } else {
      router.replace('/(auth)/onboarding');
    }
  }, [navState?.key, profileChecked, fontsLoaded, fontError, hasProfile]);

  if ((!fontsLoaded && !fontError) || !profileChecked) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
