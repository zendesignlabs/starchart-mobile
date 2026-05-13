import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth';
import { getSubscriptionStatus, createCheckoutSession, type SubscriptionStatus } from '../../src/lib/api';

const PROFILE_KEY = '@starchart/profile';
const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/test_00000000'; // swap for live portal link

interface Profile {
  name: string;
  birthDatetime: string;
  birthPlace: string;
}

function formatTrialEnd(trialEnd: number | null | undefined): string {
  if (!trialEnd) return '';
  const d = new Date(trialEnd * 1000);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

// ─── Row components ───────────────────────────────────────────────────────────

function SettingsRow({
  label,
  value,
  onPress,
  destructive,
  accent,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  accent?: boolean;
}) {
  return (
    <TouchableOpacity
      style={sStyles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[
        sStyles.rowLabel,
        destructive && { color: '#CC2200' },
        accent && { color: colors.textPrimary, fontFamily: fontFamilies.bodyMedium },
      ]}>
        {label}
      </Text>
      {value !== undefined && (
        <Text style={sStyles.rowValue}>{value}</Text>
      )}
    </TouchableOpacity>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sStyles.sectionHeader}>
      <Text style={sStyles.sectionLabel}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(PROFILE_KEY).then((raw) => {
      if (raw) setProfile(JSON.parse(raw));
    });
    getSubscriptionStatus()
      .then(setSubStatus)
      .catch(() => setSubStatus(null))
      .finally(() => setSubLoading(false));
  }, []);

  async function handleManageSub() {
    // If no subscription yet, open Stripe checkout.
    // If active, link to Stripe customer portal.
    if (!subStatus?.active) {
      try {
        const { url } = await createCheckoutSession(
          'starchart://subscription/success',
          'starchart://subscription/cancel'
        );
        await Linking.openURL(url);
      } catch {
        Alert.alert('Error', 'Could not open checkout.');
      }
    } else {
      // Replace with live Stripe customer portal URL once configured
      await Linking.openURL(STRIPE_PORTAL_URL);
    }
  }

  async function handleEditBirthData() {
    Alert.alert(
      'Edit birth data',
      'This will let you update date, time, and place, then recalculate your chart. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            router.replace({
              pathname: '/(auth)/onboarding',
              params: { mode: 'editBirthData' },
            });
          },
        },
      ]
    );
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/');
        },
      },
    ]);
  }

  const birthDate = profile
    ? new Date(profile.birthDatetime).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : '';

  function subStatusLabel(): string {
    if (subLoading) return 'Checking…';
    if (!subStatus || subStatus.status === 'none') return 'No subscription';
    if (subStatus.trialing) {
      const end = formatTrialEnd(subStatus.trialEnd);
      return end ? `Free trial · ends ${end}` : 'Free trial';
    }
    if (subStatus.active) return 'Active · $9.99/month';
    return subStatus.status.charAt(0).toUpperCase() + subStatus.status.slice(1);
  }

  return (
    <ScrollView
      style={sStyles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[sStyles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={sStyles.heading}>Settings</Text>
      </View>

      {/* Account */}
      <SectionHeader label="Account" />
      <SettingsRow label="Email" value={email ?? '—'} />

      {/* Subscription */}
      <SectionHeader label="Subscription" />
      <SettingsRow label="Status" value={subStatusLabel()} />
      <SettingsRow
        label={subStatus?.active ? 'Manage subscription' : 'Subscribe'}
        onPress={handleManageSub}
        accent={!subStatus?.active}
      />

      {/* Birth data */}
      <SectionHeader label="Birth data" />
      {profile && (
        <>
          <SettingsRow label="Name" value={profile.name} />
          <SettingsRow label="Date & time" value={birthDate} />
          <SettingsRow label="Place" value={profile.birthPlace} />
        </>
      )}
      <SettingsRow label="Edit birth data" onPress={handleEditBirthData} />

      {/* Account actions */}
      <SectionHeader label="" />
      <SettingsRow label="Sign out" onPress={handleSignOut} destructive />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const sStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
  },
  heading: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes['2xl'],
    color: colors.textPrimary,
  },
  sectionHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBlack,
    backgroundColor: colors.backgroundSecondary,
  },
  sectionLabel: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
    minHeight: 52,
  },
  rowLabel: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    flex: 1,
  },
  rowValue: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    maxWidth: '55%',
    textAlign: 'right',
  },
});
