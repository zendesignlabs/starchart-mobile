import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import * as ephemeris from '../../src/lib/ephemeris';
import type { AstrocartographyLine, TransitAspect, Planet, LineType } from '../../src/types/chart';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  name: string;
  birthDatetime: string;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  chartData: import('../../src/types/chart').ChartData;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@starchart/profile';

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
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MapScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lines, setLines] = useState<AstrocartographyLine[]>([]);
  const [transits, setTransits] = useState<TransitAspect[]>([]);
  const [activatedPlanets, setActivatedPlanets] = useState<Set<Planet>>(new Set());
  const [focusPlanet, setFocusPlanet] = useState<Planet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p: Profile = JSON.parse(raw);
      setProfile(p);

      if (!p.birthDatetime || typeof p.birthLat !== 'number' || typeof p.birthLng !== 'number') {
        setError('Your saved birth data is incomplete. Please rerun onboarding.');
        return;
      }

      const [acgLines, aspects] = await Promise.all([
        ephemeris.calculateACGLines(p.birthDatetime, p.birthLat, p.birthLng),
        ephemeris.getTransitsToNatal(p.birthDatetime, p.birthLat, p.birthLng),
      ]);

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

  useEffect(() => { load(); }, [load]);

  // ── Render helpers ──────────────────────────────────────────────────────────

  function lineStroke(line: AstrocartographyLine): { color: string; width: number; opacity: number } {
    const isActivated = activatedPlanets.has(line.planet);
    const isFocused = focusPlanet !== null;

    if (isActivated && (!isFocused || focusPlanet === line.planet)) {
      return { color: colors.accentYellow, width: 3, opacity: 1 };
    }
    if (isFocused) {
      if (focusPlanet === line.planet) {
        return { color: LINE_COLORS[line.lineType] ?? colors.textSecondary, width: 2, opacity: 1 };
      }
      return { color: colors.textSecondary, width: 1, opacity: 0.2 };
    }
    return { color: LINE_COLORS[line.lineType] ?? colors.textSecondary, width: 2, opacity: 0.6 };
  }

  // Sort so activated lines render on top (last in array = top in MapView)
  const sortedLines = [...(Array.isArray(lines) ? lines : [])].sort((a, b) => {
    const aActive = activatedPlanets.has(a.planet) ? 1 : 0;
    const bActive = activatedPlanets.has(b.planet) ? 1 : 0;
    return aActive - bActive;
  });

  const activatedList = Array.from(activatedPlanets).slice(0, 3);

  async function restartOnboarding() {
    await AsyncStorage.removeItem(STORAGE_KEY);
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
        <Text style={styles.appName}>STARCHART</Text>
        <Text style={styles.dateText}>{formatDate(new Date())}</Text>
      </View>

      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: profile?.birthLat ?? 20,
          longitude: profile?.birthLng ?? 0,
          latitudeDelta: 100,
          longitudeDelta: 150,
        }}
        mapType="standard"
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
              />
            );
          })}
      </MapView>

      {/* Bottom sheet */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetHeader}>Your map right now</Text>

        {activatedList.length === 0 ? (
          <Text style={styles.sheetEmpty}>No lines strongly activated at the moment.</Text>
        ) : (
          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {activatedList.map((planet) => {
              const isFocused = focusPlanet === planet;
              return (
                <TouchableOpacity
                  key={planet}
                  style={[styles.planetRow, isFocused && styles.planetRowActive]}
                  onPress={() => setFocusPlanet(isFocused ? null : planet)}
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
  appName: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  dateText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  map: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundPrimary,
    borderTopWidth: 2,
    borderTopColor: colors.borderBlack,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.base,
    maxHeight: 260,
  },
  sheetHeader: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sheetEmpty: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
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
});
