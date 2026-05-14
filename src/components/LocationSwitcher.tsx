import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fontFamilies, fontSizes, spacing } from '../theme';
import {
  getActiveLocation,
  newLocationFromPlace,
  updateProfile,
  type PlaceResult,
} from '../lib/profile';
import type { StoredProfile } from '../types/profile';

interface LocationSwitcherProps {
  profile: StoredProfile;
  onProfileChange: (profile: StoredProfile) => void;
  compact?: boolean;
}

export function LocationSwitcher({ profile, onProfileChange, compact }: LocationSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const active = getActiveLocation(profile);

  async function selectLocation(id?: string) {
    const next = await updateProfile((current) => ({
      ...current,
      activeLocationId: id,
    }));
    if (next) onProfileChange(next);
    setOpen(false);
  }

  async function searchPlaces() {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'starchart-mobile/1.0' },
      });
      const data: PlaceResult[] = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function addLocation(place: PlaceResult) {
    const location = newLocationFromPlace(place);
    if (!location) {
      Alert.alert('Could not add location', 'That search result did not include usable coordinates.');
      return;
    }

    const next = await updateProfile((current) => ({
      ...current,
      relocations: [...(current.relocations ?? []), location],
      activeLocationId: location.id,
    }));
    if (next) onProfileChange(next);
    setQuery('');
    setResults([]);
    setOpen(false);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.chip, !active.isBirth && styles.chipActive, compact && styles.chipCompact]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.chipEyebrow}>{active.isBirth ? 'Birth location' : 'Relocated'}</Text>
        <Text style={styles.chipLabel} numberOfLines={1}>{active.label}</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Active location</Text>
                <Text style={styles.sheetSubtitle}>Whole Sign houses update on Chart</Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.locationList} keyboardShouldPersistTaps="handled">
              <LocationRow
                title="Birth"
                subtitle={profile.birthPlace}
                selected={active.isBirth}
                onPress={() => selectLocation(undefined)}
              />
              {(profile.relocations ?? []).map((location) => (
                <LocationRow
                  key={location.id}
                  title={location.name}
                  subtitle={location.place}
                  selected={active.id === location.id}
                  onPress={() => selectLocation(location.id)}
                />
              ))}
            </ScrollView>

            <View style={styles.addBox}>
              <Text style={styles.addLabel}>Add relocation</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={(v) => {
                    setQuery(v);
                    if (results.length) setResults([]);
                  }}
                  placeholder="Search city or place"
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="search"
                  onSubmitEditing={searchPlaces}
                />
                <TouchableOpacity style={styles.searchButton} onPress={searchPlaces}>
                  {searching ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.searchButtonText}>Go</Text>}
                </TouchableOpacity>
              </View>
              {results.map((place, i) => (
                <TouchableOpacity
                  key={`${place.lat}-${place.lon}-${i}`}
                  style={styles.resultRow}
                  onPress={() => addLocation(place)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.resultText} numberOfLines={2}>{place.display_name}</Text>
                  <Text style={styles.resultAction}>Add</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function LocationRow({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.locationRow, selected && styles.locationRowSelected]} onPress={onPress}>
      <View style={styles.locationTextWrap}>
        <Text style={styles.locationTitle}>{title}</Text>
        <Text style={styles.locationSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
      <Text style={styles.check}>{selected ? '✓' : ''}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 160,
  },
  chipActive: {
    backgroundColor: colors.accentPink,
  },
  chipCompact: {
    maxWidth: 136,
  },
  chipEyebrow: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 9,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipLabel: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginTop: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: colors.backgroundPrimary,
    borderTopWidth: 3,
    borderColor: colors.borderBlack,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.base,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
  },
  sheetTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  sheetSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderBlack,
  },
  closeText: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  locationList: {
    maxHeight: 260,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
  },
  locationRowSelected: {
    backgroundColor: colors.accentYellow,
    borderBottomColor: colors.borderBlack,
  },
  locationTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  locationTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  locationSubtitle: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  check: {
    width: 24,
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  addBox: {
    padding: spacing.base,
    borderTopWidth: 2,
    borderTopColor: colors.borderBlack,
    backgroundColor: colors.backgroundSecondary,
  },
  addLabel: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  searchButton: {
    width: 56,
    borderLeftWidth: 2,
    borderLeftColor: colors.borderBlack,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentYellow,
  },
  searchButtonText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBlack,
  },
  resultText: {
    flex: 1,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    paddingRight: spacing.sm,
  },
  resultAction: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
});
