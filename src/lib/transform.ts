// Transforms raw ephemeris responses to the shape expected by the mobile app.

import type {
  AspectType,
  AstrocartographyLine,
  ChartData,
  LineType,
  Planet,
  ZodiacSign,
} from '../types/chart';

const SIGNS: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

const PLANET_NAME_MAP: Record<string, Planet> = {
  Sun: 'sun', Moon: 'moon', Mercury: 'mercury', Venus: 'venus',
  Mars: 'mars', Jupiter: 'jupiter', Saturn: 'saturn', Uranus: 'uranus',
  Neptune: 'neptune', Pluto: 'pluto', Chiron: 'chiron', NNode: 'north_node',
};

const LINE_COLORS: Record<LineType, string> = {
  AC: '#FF6B9D',
  DC: '#BD00FF',
  MC: '#00A8FF',
  IC: '#00FF87',
};

interface EphemerisPosition {
  name: string;
  longitude: number;
  speed: number;
  retrograde: boolean;
}

interface EphemerisHouses {
  cusps: number[];
  asc: number;
  mc: number;
}

interface EphemerisAspect {
  planet1: string;
  planet2: string;
  type: AspectType;
  orb: number;
}

interface RawChartResponse {
  calculatedAt?: string;
  positions?: EphemerisPosition[];
  houses?: EphemerisHouses;
  aspects?: EphemerisAspect[];
  acgLines?: Record<string, Array<[number, number]>>;
}

function normalizeL(lon: number): number {
  return ((lon % 360) + 360) % 360;
}

function lonToSign(lon: number): { sign: ZodiacSign; degree: number; minute: number } {
  const n = normalizeL(lon);
  const signIndex = Math.floor(n / 30);
  const withinSign = n % 30;
  return {
    sign: SIGNS[signIndex],
    degree: Math.floor(withinSign),
    minute: Math.floor((withinSign % 1) * 60),
  };
}

function signIndex(lon: number): number {
  return Math.floor(normalizeL(lon) / 30);
}

function getWholeSignHouse(planetLon: number, ascLon: number): number {
  const ascSign = signIndex(ascLon);
  const planetSign = signIndex(planetLon);
  return ((planetSign - ascSign + 12) % 12) + 1;
}

function wholeSignHouses(ascLon: number) {
  const ascSign = signIndex(ascLon);
  return Array.from({ length: 12 }, (_, i) => {
    const signStart = normalizeL((ascSign + i) * 30);
    return {
      house: i + 1,
      longitude: signStart,
      ...lonToSign(signStart),
    };
  });
}

function planetName(name: string): Planet {
  return PLANET_NAME_MAP[name] ?? (name.toLowerCase() as Planet);
}

export function transformRawChart(raw: RawChartResponse): { chartData: ChartData; acgLines: AstrocartographyLine[] } {
  const cusps = raw.houses?.cusps ?? [];
  const houses = raw.houses;

  if (!houses || cusps.length !== 12 || !Array.isArray(raw.positions)) {
    throw new Error('Ephemeris response was missing chart data.');
  }

  const chartData: ChartData = {
    calculatedAt: raw.calculatedAt ?? new Date().toISOString(),
    planets: raw.positions.map((p) => ({
      name: planetName(p.name),
      ...lonToSign(p.longitude),
      house: getWholeSignHouse(p.longitude, houses.asc),
      longitude: p.longitude,
      speed: p.speed,
      retrograde: p.retrograde,
    })),
    houses: wholeSignHouses(houses.asc),
    angles: {
      ascendant: lonToSign(houses.asc),
      midheaven: lonToSign(houses.mc),
      descendant: lonToSign(normalizeL(houses.asc + 180)),
      imumCoeli: lonToSign(normalizeL(houses.mc + 180)),
    },
    aspects: (raw.aspects ?? []).map((a) => ({
      planet1: planetName(a.planet1),
      planet2: planetName(a.planet2),
      type: a.type,
      orb: Math.abs(a.orb),
      applying: false,
    })),
  };

  const acgLines = Object.entries(raw.acgLines ?? {})
    .map(([key, coordinates]) => {
      const [rawPlanet, rawLineType] = key.split('_');
      const planet = PLANET_NAME_MAP[rawPlanet];
      const lineType = rawLineType as LineType;
      if (!planet || !['AC', 'DC', 'MC', 'IC'].includes(lineType) || !Array.isArray(coordinates)) {
        return null;
      }
      return {
        planet,
        lineType,
        coordinates,
        color: LINE_COLORS[lineType],
        weight: 2,
        dashed: false,
        visible: true,
      };
    })
    .filter(Boolean) as AstrocartographyLine[];

  return { chartData, acgLines };
}
