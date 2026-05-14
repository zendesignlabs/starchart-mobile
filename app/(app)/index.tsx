import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import * as ephemeris from '../../src/lib/ephemeris';
import { LocationSwitcher } from '../../src/components/LocationSwitcher';
import { getActiveLocation, newPinnedLocation, PROFILE_KEY, readProfile, writeProfile } from '../../src/lib/profile';
import type { AstrocartographyLine, TransitAspect, Planet, LineType } from '../../src/types/chart';
import type { StoredProfile } from '../../src/types/profile';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface FocusPlace {
  name: string;
  latitude: number;
  longitude: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LINE_COLORS: Record<LineType, string> = {
  AC: colors.accentPink,
  DC: '#BD00FF', // accentPurple
  MC: colors.accentBlue,
  IC: '#00FF87', // accentGreen
};

const PLANET_SUMMARIES: Record<string, string> = {
  sun: 'identity, vitality, self-expression',
  moon: 'emotion, instinct, home and belonging',
  mercury: 'communication, ideas, local movement',
  venus: 'beauty, relationships, pleasure and art',
  mars: 'drive, ambition, physical energy',
  jupiter: 'expansion, luck, philosophy and growth',
  saturn: 'commitment, structure, long-term work',
  uranus: 'disruption, innovation, sudden change',
  neptune: 'dreams, spirituality, dissolution of limits',
  pluto: 'transformation, power, deep regeneration',
  north_node: 'karmic direction, growth edge, dharma',
  chiron: 'wound and wisdom, the healer within',
};

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}

function lineLabel(line: AstrocartographyLine) {
  return `${capitalize(line.planet)} ${line.lineType}`;
}

function lineLabelCoordinate(line: AstrocartographyLine) {
  const coords = Array.isArray(line.coordinates) ? line.coordinates : [];
  if (coords.length === 0) return null;
  const [lng, lat] = coords[Math.floor(coords.length / 2)];
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  return { latitude: lat, longitude: lng };
}

function isPlanet(value: string | undefined): value is Planet {
  return !!value && [
    'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter',
    'saturn', 'uranus', 'neptune', 'pluto', 'north_node', 'chiron',
  ].includes(value);
}

function isLineType(value: string | undefined): value is LineType {
  return value === 'AC' || value === 'DC' || value === 'MC' || value === 'IC';
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ planet?: string; lineType?: string }>();
  const mapRef = useRef<MapView | null>(null);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [lines, setLines] = useState<AstrocartographyLine[]>([]);
  const [transits, setTransits] = useState<TransitAspect[]>([]);
  const [activatedPlanets, setActivatedPlanets] = useState<Set<Planet>>(new Set());
  const [focusPlanet, setFocusPlanet] = useState<Planet | null>(null);
  const [selectedLine, setSelectedLine] = useState<AstrocartographyLine | null>(null);
  const [sheetCollapsed, setSheetCollapsed] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [focusPlace, setFocusPlace] = useState<FocusPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (!raw) {
        setProfile(null);
        setLines([]);
        setTransits([]);
        setActivatedPlanets(new Set());
        return;
      }
      const p: StoredProfile = JSON.parse(raw);
      setProfile(p);
      setSelectedLine(null);
      setFocusPlanet(null);

      if (!p.birthDatetime || typeof p.birthLat !== 'number' || typeof p.birthLng !== 'number') {
        setError('Your saved birth data is incomplete. Please rerun onboarding.');
        return;
      }

      const [chartData, acgLines, aspects] = await Promise.all([
        ephemeris.calculateChart(p.birthDatetime, p.birthLat, p.birthLng),
        ephemeris.calculateACGLines(p.birthDatetime, p.birthLat, p.birthLng),
        ephemeris.getTransitsToNatal(p.birthDatetime, p.birthLat, p.birthLng),
      ]);

      if (p.chartCalculatedFor !== p.birthDatetime) {
        const refreshedProfile = {
          ...p,
          chartData,
          chartCalculatedFor: p.birthDatetime,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(refreshedProfile));
        setProfile(refreshedProfile);
      }

      const safeLines = Array.isArray(acgLines) ? acgLines : [];
      const safeAspects = Array.isArray(aspects) ? aspects : [];

      setLines(safeLines);
      setTransits(safeAspects);

      // Activated = natal planets where a transit is within 3° orb
      const activated = new Set<Planet>(
        safeAspects.filter((a) => a.orb < 3).map((a) => a.natalPlanet)
      );
      setActivatedPlanets(activated);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load map data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!isPlanet(params.planet) || !isLineType(params.lineType) || lines.length === 0) return;

    const match = lines.find((line) => line.planet === params.planet && line.lineType === params.lineType);
    if (!match) return;

    const coordinate = lineLabelCoordinate(match);
    setFocusPlanet(match.planet);
    setSelectedLine(match);
    setSheetCollapsed(false);

    if (coordinate) {
      mapRef.current?.animateToRegion({
        ...coordinate,
        latitudeDelta: 28,
        longitudeDelta: 28,
      }, 650);
    }
  }, [params.planet, params.lineType, lines]);

  // ── Render helpers ──────────────────────────────────────────────────────────

  function lineStroke(line: AstrocartographyLine): { color: string; width: number; opacity: number } {
    const isActivated = activatedPlanets.has(line.planet);
    const isFocused = focusPlanet !== null;

    if (isActivated && (!isFocused || focusPlanet === line.planet)) {
      return { color: colors.accentYellow, width: 4, opacity: 1 };
    }
    if (isFocused) {
      if (focusPlanet === line.planet) {
        return { color: LINE_COLORS[line.lineType] ?? colors.textSecondary, width: 3, opacity: 1 };
      }
      return { color: colors.textSecondary, width: 1, opacity: 0.18 };
    }
    return { color: LINE_COLORS[line.lineType] ?? colors.textSecondary, width: 2, opacity: 0.55 };
  }

  // Sort so activated lines render on top (last in array = top in MapView)
  const sortedLines = [...(Array.isArray(lines) ? lines : [])].sort((a, b) => {
    const aActive = activatedPlanets.has(a.planet) ? 1 : 0;
    const bActive = activatedPlanets.has(b.planet) ? 1 : 0;
    return aActive - bActive;
  });

  const activeLocation = profile ? getActiveLocation(profile) : null;
  const activatedList = Array.from(activatedPlanets).slice(0, 4);
  const labelLines = sortedLines.filter((line) => {
    if (selectedLine && line.planet === selectedLine.planet && line.lineType === selectedLine.lineType) return true;
    if (focusPlanet && line.planet === focusPlanet) return true;
    return false;
  });

  async function searchPlaces() {
    const q = placeQuery.trim();
    if (q.length < 2) return;
    setPlaceSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'starchart-mobile/1.0' },
      });
      const data: PlaceResult[] = await res.json();
      setPlaceResults(Array.isArray(data) ? data : []);
    } catch {
      setPlaceResults([]);
    } finally {
      setPlaceSearching(false);
    }
  }

  function focusOnPlace(place: PlaceResult) {
    const latitude = parseFloat(place.lat);
    const longitude = parseFloat(place.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;

    const focused = { name: place.display_name, latitude, longitude };
    setFocusPlace(focused);
    setPlaceQuery(place.display_name.split(',').slice(0, 2).join(','));
    setPlaceResults([]);
    setSheetCollapsed(true);
    mapRef.current?.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 22,
      longitudeDelta: 22,
    }, 650);
  }

  function handleProfileChange(next: StoredProfile) {
    setProfile(next);
    const nextActive = getActiveLocation(next);
    mapRef.current?.animateToRegion({
      latitude: nextActive.lat,
      longitude: nextActive.lng,
      latitudeDelta: 22,
      longitudeDelta: 22,
    }, 650);
  }

  async function savePinnedRelocation(latitude: number, longitude: number) {
    const current = await readProfile();
    if (!current) return;
    const location = newPinnedLocation(latitude, longitude);
    const next = {
      ...current,
      relocations: [...(current.relocations ?? []), location],
      activeLocationId: location.id,
    };
    await writeProfile(next);
    handleProfileChange(next);
  }

  function handleMapLongPress(event: any) {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setFocusPlace({ name: 'Pinned location', latitude, longitude });
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 18, longitudeDelta: 18 }, 500);
    Alert.alert(
      'Save relocation?',
      'Use this pinned place as your active relocated chart location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: () => savePinnedRelocation(latitude, longitude) },
      ]
    );
  }

  async function restartOnboarding() {
    await AsyncStorage.removeItem(PROFILE_KEY);
    router.replace('/(auth)/onboarding');
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.textPrimary} />
        <Text style={styles.loadingText}>Calculating your map…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.recoveryButton} onPress={restartOnboarding} activeOpacity={0.85}>
          <Text style={styles.recoveryButtonText}>Restart onboarding</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.screenEyebrow}>MAP</Text>
          <Text style={styles.appName}>Your Map Now</Text>
        </View>
        {profile && <LocationSwitcher profile={profile} onProfileChange={handleProfileChange} compact />}
      </View>

      {activeLocation && !activeLocation.isBirth && (
        <View style={styles.relocationBanner}>
          <Text style={styles.relocationBannerText}>
            Natal astrocartography stays fixed. Chart houses are relocated to {activeLocation.label}.
          </Text>
        </View>
      )}

      {/* Place search */}
      <View style={[styles.searchBox, activeLocation && !activeLocation.isBirth && styles.searchBoxRelocated]}>
        <TextInput
          style={styles.searchInput}
          value={placeQuery}
          onChangeText={(v) => {
            setPlaceQuery(v);
            if (placeResults.length > 0) setPlaceResults([]);
          }}
          placeholder="Search a place"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          onSubmitEditing={searchPlaces}
        />
        <TouchableOpacity style={styles.searchButton} onPress={searchPlaces} activeOpacity={0.85}>
          {placeSearching ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.searchButtonText}>Go</Text>
          )}
        </TouchableOpacity>
      </View>
      {placeResults.length > 0 && (
        <View style={[styles.searchResults, activeLocation && !activeLocation.isBirth && styles.searchResultsRelocated]}>
          {placeResults.map((place, i) => (
            <TouchableOpacity
              key={`${place.lat}-${place.lon}-${i}`}
              style={[styles.searchResultRow, i < placeResults.length - 1 && styles.searchResultBorder]}
              onPress={() => focusOnPlace(place)}
              activeOpacity={0.8}
            >
              <Text style={styles.searchResultText} numberOfLines={2}>{place.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: activeLocation?.lat ?? 20,
          longitude: activeLocation?.lng ?? 0,
          latitudeDelta: activeLocation ? 45 : 100,
          longitudeDelta: activeLocation ? 45 : 150,
        }}
        mapType="standard"
        onLongPress={handleMapLongPress}
      >
        {sortedLines
          .filter((l) => l.visible !== false && Array.isArray(l.coordinates) && l.coordinates.length > 0)
          .map((line, i) => {
            const { color, width, opacity } = lineStroke(line);
            // coordinates come as [lng, lat]; MapView expects { latitude, longitude }
            const coords = line.coordinates
              .filter((pair) => Array.isArray(pair) && pair.length === 2)
              .map(([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
              }));
            return (
              <Polyline
                key={`${line.planet}-${line.lineType}-${i}`}
                coordinates={coords}
                strokeColor={color}
                strokeWidth={width}
                strokeColors={undefined}
                lineCap="round"
                lineJoin="round"
                zIndex={activatedPlanets.has(line.planet) ? 10 : 1}
                style={{ opacity }}
                tappable
                onPress={() => {
                  setSelectedLine(line);
                  setFocusPlanet(line.planet);
                }}
              />
            );
          })}
        {activeLocation && !activeLocation.isBirth && (
          <Marker coordinate={{ latitude: activeLocation.lat, longitude: activeLocation.lng }}>
            <View style={styles.activeLocationMarker}>
              <Text style={styles.activeLocationMarkerText}>⌖</Text>
            </View>
          </Marker>
        )}
        {focusPlace && (
          <Marker coordinate={{ latitude: focusPlace.latitude, longitude: focusPlace.longitude }}>
            <View style={styles.placeMarker}>
              <Text style={styles.placeMarkerText}>◆</Text>
            </View>
          </Marker>
        )}
        {labelLines.map((line, i) => {
          const coordinate = lineLabelCoordinate(line);
          if (!coordinate) return null;
          const isActivated = activatedPlanets.has(line.planet);
          return (
            <Marker
              key={`label-${line.planet}-${line.lineType}-${i}`}
              coordinate={coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[styles.lineLabel, isActivated && styles.lineLabelActive]}>
                <Text style={styles.lineLabelText}>{lineLabel(line)}</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Bottom sheet */}
      <View style={[styles.bottomSheet, sheetCollapsed && styles.bottomSheetCollapsed]}>
        <TouchableOpacity
          style={styles.sheetHandle}
          onPress={() => setSheetCollapsed(!sheetCollapsed)}
          activeOpacity={0.85}
        >
          <Text style={styles.sheetHeader}>Natal ACG lines</Text>
          <Text style={styles.sheetToggle}>{sheetCollapsed ? 'Expand ↑' : 'Collapse ↓'}</Text>
        </TouchableOpacity>

        {sheetCollapsed ? (
          <Text style={styles.sheetNoteCollapsed}>
            {selectedLine ? lineLabel(selectedLine) : `${lines.length} natal lines visible`}
          </Text>
        ) : (
          <>
        <Text style={styles.sheetNote}>All natal lines are visible. Yellow lines are natal planets currently activated by transits.</Text>

        {selectedLine && (
          <View style={styles.selectedLineCard}>
            <Text style={styles.selectedLineTitle}>{lineLabel(selectedLine)}</Text>
            <Text style={styles.planetSummary}>{PLANET_SUMMARIES[selectedLine.planet] ?? ''}</Text>
          </View>
        )}

        {activatedList.length === 0 ? (
          <View>
            <Text style={styles.sheetEmpty}>No natal planets strongly activated by current transits.</Text>
            <TouchableOpacity
              style={styles.sheetAction}
              onPress={() => router.push('/(app)/lines')}
              activeOpacity={0.85}
            >
              <Text style={styles.sheetActionText}>Browse all lines →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {activatedList.map((planet) => {
              const isFocused = focusPlanet === planet;
              return (
                <TouchableOpacity
                  key={planet}
                  style={[styles.planetRow, isFocused && styles.planetRowActive]}
                  onPress={() => {
                    setFocusPlanet(isFocused ? null : planet);
                    setSelectedLine(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.planetName}>
                    {capitalize(planet)} lines activated
                  </Text>
                  <Text style={styles.planetSummary}>
                    {PLANET_SUMMARIES[planet] ?? ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
          </>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    padding: spacing.base,
  },
  loadingText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  recoveryButton: {
    backgroundColor: colors.accentYellow,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  recoveryButtonText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
    zIndex: 10,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  screenEyebrow: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  appName: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
  },
  relocationBanner: {
    position: 'absolute',
    top: 108,
    left: spacing.base,
    right: spacing.base,
    zIndex: 22,
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.accentPink,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  relocationBannerText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  map: {
    flex: 1,
  },
  searchBox: {
    position: 'absolute',
    top: 118,
    left: spacing.base,
    right: spacing.base,
    zIndex: 20,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
  },
  searchBoxRelocated: {
    top: 172,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  searchButton: {
    width: 58,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 2,
    borderLeftColor: colors.borderBlack,
    backgroundColor: colors.accentYellow,
  },
  searchButtonText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  searchResults: {
    position: 'absolute',
    top: 164,
    left: spacing.base,
    right: spacing.base,
    zIndex: 21,
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
  },
  searchResultsRelocated: {
    top: 218,
  },
  searchResultRow: {
    padding: spacing.sm,
  },
  searchResultBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderBlack,
  },
  searchResultText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  activeLocationMarker: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.accentPink,
  },
  activeLocationMarkerText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
  },
  placeMarker: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.accentYellow,
  },
  placeMarkerText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundPrimary,
    borderTopWidth: 2,
    borderTopColor: colors.borderBlack,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    maxHeight: 300,
  },
  bottomSheetCollapsed: {
    maxHeight: 92,
    paddingBottom: spacing.md,
  },
  sheetHandle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  sheetHeader: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sheetToggle: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  sheetNote: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  sheetNoteCollapsed: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  selectedLineCard: {
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.accentYellow,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedLineTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  sheetEmpty: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  sheetAction: {
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: colors.borderBlack,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sheetActionText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  sheetScroll: {
    flex: 1,
  },
  planetRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderBlack,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  planetRowActive: {
    backgroundColor: colors.accentYellow,
    borderWidth: 2,
  },
  planetName: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
  },
  planetSummary: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  lineLabel: {
    borderWidth: 1,
    borderColor: colors.borderBlack,
    backgroundColor: colors.backgroundPrimary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  lineLabelActive: {
    backgroundColor: colors.accentYellow,
    borderWidth: 2,
  },
  lineLabelText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: 10,
    color: colors.textPrimary,
  },
});
