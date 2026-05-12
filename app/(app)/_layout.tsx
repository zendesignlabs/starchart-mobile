import { Tabs } from 'expo-router';
import { colors, fontFamilies, fontSizes } from '../../src/theme';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.backgroundPrimary,
          borderTopWidth: 2,
          borderTopColor: colors.borderBlack,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamilies.bodyMedium,
          fontSize: fontSizes.xs,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Map' }} />
      <Tabs.Screen name="chart" options={{ title: 'Chart' }} />
      <Tabs.Screen name="lines" options={{ title: 'Lines' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
