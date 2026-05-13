import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { AppState, AppStateStatus, Text, View } from 'react-native';
import { colors, fontFamilies, fontSizes } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth';
import { getSubscriptionStatus } from '../../src/lib/api';

const TAB_ICONS: Record<string, string> = {
  index: '◎',
  chart: '☉',
  lines: '☷',
  settings: '⚙︎',
};

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 28,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.accentYellow : 'transparent',
        borderWidth: focused ? 1 : 0,
        borderColor: colors.borderBlack,
      }}
    >
      <Text
        style={{
          fontFamily: fontFamilies.heading,
          fontSize: 16,
          color: focused ? colors.textPrimary : colors.textSecondary,
        }}
      >
        {TAB_ICONS[name] ?? '·'}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [subChecked, setSubChecked] = useState(false);

  async function checkSubscription() {
    if (!token) {
      router.replace('/(auth)/');
      return;
    }
    try {
      const status = await getSubscriptionStatus();
      if (!status.active) {
        router.replace('/(auth)/paywall');
      }
    } catch {
      // Network failure — let the user in rather than hard-locking them out.
      // The server will enforce access when actual data requests are made.
    } finally {
      setSubChecked(true);
    }
  }

  // Check on mount and whenever the app comes back to foreground
  // (handles the return-from-Stripe-checkout flow).
  useEffect(() => {
    checkSubscription();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkSubscription();
    });
    return () => sub.remove();
  }, [token]);

  if (!subChecked) return null;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.backgroundPrimary,
          borderTopWidth: 2,
          borderTopColor: colors.borderBlack,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarItemStyle: {
          paddingTop: 6,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilies.bodyMedium,
          fontSize: fontSizes.xs,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Map' }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart' }} />
      <Tabs.Screen name="lines" options={{ title: 'Lines' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
