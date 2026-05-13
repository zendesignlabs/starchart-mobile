import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fontFamilies, fontSizes, spacing } from '../../src/theme';
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
        <Text style={sStyles.symbolText}>{label}</Text>
      </View>
      <View style={sStyles.rowRight}>
        <Text style={sStyles.signSymbol}>{SIGN_SYMBOLS[sign]}</Text>
        <Text style={sStyles.signName}>{capitalize(sign)}</Text>
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
        <Text style={sStyles.planetName}>
          {capitalize(planet.name)}{planet.retrograde ? ' ℞' : ''}
        </Text>
      </View>
      <View style={sStyles.rowRight}>
        <Text style={sStyles.signSymbol}>{SIGN_SYMBOLS[planet.sign]}</Text>
        <Text style={sStyles.signName}>{capitalize(planet.sign)}</Text>
        <Text style={sStyles.degree}>{formatDegree(planet.degree, planet.minute)}</Text>
        <View style={sStyles.housePill}>
          <Text style={sStyles.houseText}>{planet.house}</Text>
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
  chartData: ChartData | { chartData: ChartData };
}

function normalizeChartData(chartData: Profile['chartData']): ChartData | null {
  if (!chartData) return null;
  if ('chartData' in chartData) return chartData.chartData;
  return chartData;
}

export default function ChartScreen() {
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setProfile(JSON.parse(raw));
    });
  }, []);

  if (!profile) {
    return (
      <View style={[sStyles.container, { paddingTop: insets.top }]}>
        <View style={sStyles.header}>
          <Text style={sStyles.heading}>Natal Chart</Text>
        </View>
      </View>
    );
  }

  const { chartData, name, birthDatetime, birthPlace } = profile;
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

  const birthDate = new Date(birthDatetime).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

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
        <Text style={sStyles.subheading}>{name} · {birthDate}</Text>
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
          {significantAspects.map((a, i) => {
            const isHarmonious = HARMONIOUS.includes(a.type);
            const isChallenging = CHALLENGING.includes(a.type);
            const accentColor = isHarmonious
              ? colors.accentGreen
              : isChallenging
              ? colors.accentPink
              : colors.accentBlue;
            return (
              <View key={i} style={sStyles.row}>
                <View style={sStyles.rowLeft}>
                  <Text style={[sStyles.symbolText, { color: accentColor }]}>
                    {PLANET_SYMBOLS[a.planet1]}
                  </Text>
                  <Text style={[sStyles.aspectSymbol, { color: accentColor }]}>
                    {ASPECT_SYMBOLS[a.type]}
                  </Text>
                  <Text style={[sStyles.symbolText, { color: accentColor }]}>
                    {PLANET_SYMBOLS[a.planet2]}
                  </Text>
                </View>
                <View style={sStyles.rowRight}>
                  <Text style={sStyles.aspectName}>
                    {capitalize(a.planet1)} {capitalize(a.type)} {capitalize(a.planet2)}
                  </Text>
                  <Text style={sStyles.degree}>{a.orb.toFixed(1)}°</Text>
                  {a.applying && (
                    <View style={[sStyles.housePill, { backgroundColor: colors.accentYellow }]}>
                      <Text style={sStyles.houseText}>→</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
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
    minHeight: 48,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    minWidth: 0,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  symbolText: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    width: 22,
    textAlign: 'center',
  },
  planetName: {
    fontFamily: fontFamilies.bodyMedium,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  signSymbol: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  signName: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    width: 58,
  },
  degree: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    width: 44,
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
  aspectSymbol: {
    fontFamily: fontFamilies.heading,
    fontSize: fontSizes.md,
  },
  aspectName: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    flex: 1,
  },
});
