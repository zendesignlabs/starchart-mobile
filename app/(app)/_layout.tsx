import { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { AppState, AppStateStatus, Text, View } from 'react-native';
import { colors, fontFamilies, fontSizes } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth';
import { getSubscriptionStatus } from '../../src/lib/api';

const TAB_ITEMS: Record<string, { icon: string; label: string }> = {
  index: { icon: '◎', label: 'Map' },
  chart: { icon: '☉', label: 'Chart' },
  lines: { icon: '☷', label: 'Lines' },
  settings: { icon: '⚙︎', label: 'Settings' },
};

function TabItem({ name, focused }: { name: string; focused: boolean }) {
  const item = TAB_ITEMS[name] ?? { icon: '·', label: name };

  return (
    <View
      style={{
        width: 78,
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 3,
      }}
    >
      <Text
        style={{
          fontFamily: fontFamilies.heading,
          fontSize: focused ? 24 : 21,
          lineHeight: 26,
          color: focused ? colors.accentYellow : colors.textSecondary,
          textShadowColor: focused ? colors.borderBlack : 'transparent',
          textShadowOffset: focused ? { width: 1, height: 1 } : { width: 0, height: 0 },
          textShadowRadius: 0,
        }}
      >
        {item.icon}
      </Text>
      <Text
        style={{
          fontFamily: focused ? fontFamilies.heading : fontFamilies.bodyMedium,
          fontSize: fontSizes.xs,
          lineHeight: 14,
          color: focused ? colors.textPrimary : colors.textSecondary,
          marginTop: 2,
        }}
      >
        {item.label}
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
        tabBarIcon: ({ focused }) => <TabItem name={route.name} focused={focused} />,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          height: 74,
          backgroundColor: colors.backgroundPrimary,
          borderTopWidth: 2,
          borderTopColor: colors.borderBlack,
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 0,
          paddingBottom: 0,
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
