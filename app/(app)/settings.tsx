import { useCallback, useEffect, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import { getActiveLocation, PROFILE_KEY, writeProfile } from '../../src/lib/profile';
import type { SavedLocation, StoredProfile } from '../../src/types/profile';
import { useAuthStore } from '../../src/store/auth';
import { getSubscriptionStatus, createCheckoutSession, type SubscriptionStatus } from '../../src/lib/api';

const STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/test_00000000'; // swap for live portal link

function formatTrialEnd(trialEnd: number | null | undefined): string {
  if (!trialEnd) return '';
  const d = new Date(trialEnd * 1000);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function formatBirthDate(datetime: string, localDate?: string): string {
  const [datePart] = (localDate ?? datetime).split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return '—';
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatBirthTime(datetime: string, timeUnknown?: boolean, localTime?: string): string {
  if (timeUnknown) return 'Unknown';
  const timePart = localTime ?? datetime.split('T')[1];
  if (!timePart) return '—';
  const [hourRaw, minuteRaw] = timePart.split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return '—';

  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
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
      style={[
        sStyles.row,
        onPress && sStyles.actionRow,
        accent && sStyles.primaryActionRow,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.6 : 1}
    >
      <Text style={[
        sStyles.rowLabel,
        onPress && sStyles.actionLabel,
        destructive && { color: '#CC2200' },
        accent && { color: colors.textPrimary, fontFamily: fontFamilies.bodyMedium },
      ]}>
        {label}
      </Text>
      {value !== undefined ? (
        <Text style={sStyles.rowValue}>{value}</Text>
      ) : onPress ? (
        <Text style={[sStyles.actionArrow, destructive && { color: '#CC2200' }]}>↗</Text>
      ) : null}
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
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(PROFILE_KEY).then((raw) => {
        setProfile(raw ? JSON.parse(raw) : null);
      });
    }, [])
  );

  useEffect(() => {
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

  async function setActiveLocation(id?: string) {
    if (!profile) return;
    const next = { ...profile, activeLocationId: id };
    await writeProfile(next);
    setProfile(next);
  }

  function handleRenameLocation(location: SavedLocation) {
    Alert.prompt(
      'Rename location',
      'Choose a short label for this relocation.',
      async (name) => {
        const trimmed = name.trim();
        if (!profile || !trimmed) return;
        const next = {
          ...profile,
          relocations: (profile.relocations ?? []).map((item) =>
            item.id === location.id ? { ...item, name: trimmed } : item
          ),
        };
        await writeProfile(next);
        setProfile(next);
      },
      'plain-text',
      location.name
    );
  }

  function handleDeleteLocation(location: SavedLocation) {
    Alert.alert('Delete relocation?', `Remove ${location.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!profile) return;
          const next = {
            ...profile,
            relocations: (profile.relocations ?? []).filter((item) => item.id !== location.id),
            activeLocationId: profile.activeLocationId === location.id ? undefined : profile.activeLocationId,
            relocatedCharts: Object.fromEntries(
              Object.entries(profile.relocatedCharts ?? {}).filter(([id]) => id !== location.id)
            ),
          };
          await writeProfile(next);
          setProfile(next);
        },
      },
    ]);
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

  const birthDate = profile ? formatBirthDate(profile.birthDatetime, profile.birthLocalDate) : '';
  const birthTime = profile ? formatBirthTime(profile.birthDatetime, profile.timeUnknown, profile.birthLocalTime) : '';
  const activeLocation = profile ? getActiveLocation(profile) : null;

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
        label={subStatus?.active ? 'Manage subscription' : 'Subscribe — start 7-day trial'}
        onPress={handleManageSub}
        accent={!subStatus?.active}
      />

      {/* Birth data */}
      <SectionHeader label="Birth data" />
      {profile && (
        <>
          <SettingsRow label="Name" value={profile.name} />
          <SettingsRow label="Date" value={birthDate} />
          <SettingsRow label="Time" value={birthTime} />
          <SettingsRow label="Timezone" value={profile.birthTimezone ?? '—'} />
          <SettingsRow label="Place" value={profile.birthPlace} />
        </>
      )}
      <SettingsRow label="Edit birth data" onPress={handleEditBirthData} accent />

      {/* Saved locations */}
      <SectionHeader label="Saved locations" />
      {profile && (
        <>
          <SettingsRow
            label={activeLocation?.isBirth ? '✓ Birth location' : 'Birth location'}
            value={profile.birthPlace}
            onPress={() => setActiveLocation(undefined)}
          />
          {(profile.relocations ?? []).map((location) => (
            <View key={location.id} style={sStyles.locationBlock}>
              <TouchableOpacity
                style={sStyles.locationMainRow}
                onPress={() => setActiveLocation(location.id)}
                activeOpacity={0.85}
              >
                <View style={sStyles.locationTextWrap}>
                  <Text style={sStyles.locationName}>
                    {activeLocation?.id === location.id ? '✓ ' : ''}{location.name}
                  </Text>
                  <Text style={sStyles.locationPlace} numberOfLines={2}>{location.place}</Text>
                </View>
                <Text style={sStyles.locationTimezone}>{location.timezone}</Text>
              </TouchableOpacity>
              <View style={sStyles.locationActions}>
                <TouchableOpacity style={sStyles.locationActionButton} onPress={() => handleRenameLocation(location)}>
                  <Text style={sStyles.locationActionText}>Rename</Text>
                </TouchableOpacity>
                <TouchableOpacity style={sStyles.locationActionButton} onPress={() => handleDeleteLocation(location)}>
                  <Text style={[sStyles.locationActionText, { color: '#CC2200' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {(profile.relocations ?? []).length === 0 && (
            <Text style={sStyles.emptyLocations}>Add relocations from the location chip on Map, Chart, or Lines.</Text>
          )}
        </>
      )}

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
  actionRow: {
    borderBottomColor: colors.borderBlack,
  },
  primaryActionRow: {
    backgroundColor: colors.accentYellow,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
  },
  rowLabel: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    flex: 1,
  },
  actionLabel: {
    fontFamily: fontFamilies.bodyMedium,
    textDecorationLine: 'underline',
  },
  rowValue: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  actionArrow: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  locationBlock: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
  },
  locationMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  locationTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  locationName: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  locationPlace: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationTimezone: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    maxWidth: 92,
    textAlign: 'right',
  },
  locationActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.backgroundSecondary,
    paddingLeft: spacing.xl,
  },
  locationActionButton: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.lg,
  },
  locationActionText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    textDecorationLine: 'underline',
  },
  emptyLocations: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
});
