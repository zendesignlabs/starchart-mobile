import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
import * as ephemeris from '../../src/lib/ephemeris';
import type {
  ChartData,
  PlanetPosition,
  Planet,
  ZodiacSign,
  AspectType,
} from '../../src/types/chart';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@starchart/profile';

const SIGN_SYMBOLS: Record<ZodiacSign, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋',
  leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏',
  sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

const PLANET_SYMBOLS: Record<Planet, string> = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀',
  mars: '♂', jupiter: '♃', saturn: '♄', uranus: '♅',
  neptune: '♆', pluto: '♇', north_node: '☊', chiron: '⚷',
};

const PLANET_ORDER: Planet[] = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'north_node', 'chiron',
];

const ASPECT_SYMBOLS: Record<AspectType, string> = {
  conjunction: '☌', opposition: '☍', trine: '△',
  square: '□', sextile: '⚹', quincunx: '⚻',
  semisquare: '∠', sesquiquadrate: '⚼',
};

const HARMONIOUS: AspectType[] = ['trine', 'sextile'];
const CHALLENGING: AspectType[] = ['opposition', 'square', 'sesquiquadrate', 'semisquare'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ');
}

function formatDegree(deg: number, min: number) {
  return `${deg}°${String(min).padStart(2, '0')}'`;
}

function accentForPlanet(planet: Planet): string {
  const map: Partial<Record<Planet, string>> = {
    sun: colors.accentYellow,
    moon: colors.accentBlue,
    venus: colors.accentPink,
    mars: '#FF4444',
    jupiter: colors.accentGreen,
    saturn: '#888888',
    north_node: colors.accentPurple,
  };
  return map[planet] ?? colors.textSecondary;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={sStyles.sectionHeader}>
      <Text style={sStyles.sectionLabel}>{label}</Text>
    </View>
  );
}

function AngleRow({ label, sign, degree, minute }: {
  label: string; sign: ZodiacSign; degree: number; minute: number;
}) {
  return (
    <View style={sStyles.row}>
      <View style={sStyles.rowLeft}>
        <Text style={sStyles.angleLabel} numberOfLines={1}>{label}</Text>
      </View>
      <View style={sStyles.rowRight}>
        <Text style={sStyles.signSymbol}>{SIGN_SYMBOLS[sign]}</Text>
        <Text style={sStyles.signName} numberOfLines={1}>{capitalize(sign)}</Text>
        <Text style={sStyles.degree}>{formatDegree(degree, minute)}</Text>
      </View>
    </View>
  );
}

function PlanetRow({ planet }: { planet: PlanetPosition }) {
  return (
    <View style={sStyles.row}>
      <View style={sStyles.rowLeft}>
        <Text style={[sStyles.symbolText, { color: accentForPlanet(planet.name) }]}>
          {PLANET_SYMBOLS[planet.name]}
        </Text>
        <Text style={sStyles.planetName} numberOfLines={1}>
          {capitalize(planet.name)}{planet.retrograde ? ' ℞' : ''}
        </Text>
      </View>
      <View style={sStyles.rowRight}>
        <Text style={sStyles.signSymbol}>{SIGN_SYMBOLS[planet.sign]}</Text>
        <Text style={sStyles.signName} numberOfLines={1}>{capitalize(planet.sign)}</Text>
        <Text style={sStyles.degree}>{formatDegree(planet.degree, planet.minute)}</Text>
        <View style={sStyles.housePill}>
          <Text style={sStyles.houseText}>{planet.house}</Text>
        </View>
      </View>
    </View>
  );
}

function AspectRow({ aspect, index }: { aspect: ChartData['aspects'][number]; index: number }) {
  const isHarmonious = HARMONIOUS.includes(aspect.type);
  const isChallenging = CHALLENGING.includes(aspect.type);
  const accentColor = isHarmonious
    ? colors.accentGreen
    : isChallenging
    ? colors.accentPink
    : colors.accentBlue;

  return (
    <View key={index} style={[sStyles.row, sStyles.aspectRow]}>
      <View style={sStyles.aspectGlyphs}>
        <Text style={[sStyles.aspectPlanetGlyph, { color: accentColor }]}>{PLANET_SYMBOLS[aspect.planet1]}</Text>
        <Text style={[sStyles.aspectSymbol, { color: accentColor }]}>{ASPECT_SYMBOLS[aspect.type]}</Text>
        <Text style={[sStyles.aspectPlanetGlyph, { color: accentColor }]}>{PLANET_SYMBOLS[aspect.planet2]}</Text>
      </View>
      <View style={sStyles.aspectDetails}>
        <Text style={sStyles.aspectName} numberOfLines={2}>
          {capitalize(aspect.planet1)} {capitalize(aspect.type)} {capitalize(aspect.planet2)}
        </Text>
        <View style={sStyles.aspectMetaRow}>
          <Text style={sStyles.aspectOrb}>{aspect.orb.toFixed(1)}° orb</Text>
          {aspect.applying && (
            <View style={[sStyles.applyingPill, { backgroundColor: colors.accentYellow }]}>
              <Text style={sStyles.houseText}>applying</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface Profile {
  name: string;
  birthDatetime: string;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  birthLocalDate?: string;
  birthLocalTime?: string;
  timeUnknown?: boolean;
  chartData: ChartData | { chartData: ChartData };
  chartCalculatedFor?: string;
  updatedAt?: string;
}

function normalizeChartData(chartData: Profile['chartData']): ChartData | null {
  if (!chartData) return null;
  if ('chartData' in chartData) return chartData.chartData;
  return chartData;
}

function formatBirthTime(datetime: string, localTime?: string, timeUnknown?: boolean): string {
  if (timeUnknown) return 'time unknown';
  const timePart = localTime ?? datetime.split('T')[1]?.slice(0, 5);
  if (!timePart) return '';
  const [hourStr, minuteStr] = timePart.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

export default function ChartScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadAndRefreshChart() {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) {
          if (!cancelled) setProfile(null);
          return;
        }

        const savedProfile: Profile = JSON.parse(raw);
        if (!cancelled) setProfile(savedProfile);

        const needsRecalc =
          savedProfile.birthDatetime &&
          typeof savedProfile.birthLat === 'number' &&
          typeof savedProfile.birthLng === 'number' &&
          savedProfile.chartCalculatedFor !== savedProfile.birthDatetime;

        if (!needsRecalc) return;

        try {
          const chartData = await ephemeris.calculateChart(
            savedProfile.birthDatetime,
            savedProfile.birthLat,
            savedProfile.birthLng
          );
          const refreshedProfile = {
            ...savedProfile,
            chartData,
            chartCalculatedFor: savedProfile.birthDatetime,
            updatedAt: new Date().toISOString(),
          };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedProfile));
          if (!cancelled) setProfile(refreshedProfile);
        } catch {
          // Keep the saved chart visible if refresh fails; Settings can still edit/retry.
        }
      }

      loadAndRefreshChart();
      return () => { cancelled = true; };
    }, [])
  );

  if (!profile) {
    return (
      <View style={[sStyles.container, { paddingTop: insets.top }]}>
        <View style={sStyles.header}>
          <Text style={sStyles.heading}>Natal Chart</Text>
        </View>
      </View>
    );
  }

  const { chartData, name, birthDatetime, birthPlace, birthLocalDate, birthLocalTime, timeUnknown } = profile;
  const chart = normalizeChartData(chartData);

  if (!chart?.planets || !chart?.angles) {
    return (
      <View style={[sStyles.container, { paddingTop: insets.top }]}>
        <View style={sStyles.header}>
          <Text style={sStyles.heading}>Natal Chart</Text>
          <Text style={sStyles.subheading}>Chart data could not be loaded.</Text>
          <Text style={sStyles.place}>Go to Settings → Edit birth data to recalculate.</Text>
        </View>
      </View>
    );
  }

  const orderedPlanets = PLANET_ORDER
    .map((p) => chart.planets.find((pp) => pp.name === p))
    .filter(Boolean) as PlanetPosition[];

  const birthDate = (() => {
    const [datePart] = (birthLocalDate ?? birthDatetime).split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  })();

  const birthTime = formatBirthTime(birthDatetime, birthLocalTime, timeUnknown);

  const significantAspects = (Array.isArray(chart.aspects) ? chart.aspects : [])
    .filter((a) => a.orb <= 3)
    .sort((a, b) => a.orb - b.orb)
    .slice(0, 12);

  return (
    <ScrollView
      style={sStyles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[sStyles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={sStyles.heading}>Natal Chart</Text>
        <Text style={sStyles.subheading}>
          {name} · {birthDate}{birthTime ? ` · ${birthTime}` : ''}
        </Text>
        <Text style={sStyles.place}>{birthPlace}</Text>
      </View>

      {/* Angles */}
      <SectionHeader label="Angles" />
      <AngleRow
        label="ASC"
        sign={chart.angles.ascendant.sign}
        degree={chart.angles.ascendant.degree}
        minute={chart.angles.ascendant.minute}
      />
      <AngleRow
        label="MC"
        sign={chart.angles.midheaven.sign}
        degree={chart.angles.midheaven.degree}
        minute={chart.angles.midheaven.minute}
      />
      <AngleRow
        label="IC"
        sign={chart.angles.imumCoeli.sign}
        degree={chart.angles.imumCoeli.degree}
        minute={chart.angles.imumCoeli.minute}
      />
      <AngleRow
        label="DSC"
        sign={chart.angles.descendant.sign}
        degree={chart.angles.descendant.degree}
        minute={chart.angles.descendant.minute}
      />

      {/* Planets */}
      <SectionHeader label="Planets" />
      {orderedPlanets.map((p) => (
        <PlanetRow key={p.name} planet={p} />
      ))}

      {/* Aspects */}
      {significantAspects.length > 0 && (
        <>
          <SectionHeader label="Key Aspects  (orb ≤ 3°)" />
          {significantAspects.map((a, i) => (
            <AspectRow key={`${a.planet1}-${a.type}-${a.planet2}-${i}`} aspect={a} index={i} />
          ))}
        </>
      )}
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
  subheading: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  place: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundSecondary,
    minHeight: 52,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  symbolText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    width: 28,
    textAlign: 'center',
  },
  angleLabel: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    width: 48,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  planetName: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    flexShrink: 1,
    minWidth: 0,
  },
  signSymbol: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    width: 18,
    textAlign: 'center',
  },
  signName: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    width: 64,
  },
  degree: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    width: 46,
    textAlign: 'right',
  },
  housePill: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderBlack,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  houseText: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
  },
  aspectRow: {
    alignItems: 'flex-start',
    minHeight: 68,
    paddingVertical: spacing.md,
  },
  aspectGlyphs: {
    width: 94,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.md,
  },
  aspectPlanetGlyph: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.xl,
    lineHeight: 28,
    width: 28,
    textAlign: 'center',
  },
  aspectSymbol: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.lg,
    lineHeight: 26,
    width: 24,
    textAlign: 'center',
  },
  aspectDetails: {
    flex: 1,
    minWidth: 0,
  },
  aspectName: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    lineHeight: 19,
  },
  aspectMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  aspectOrb: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  applyingPill: {
    borderWidth: 1,
    borderColor: colors.borderBlack,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
});
