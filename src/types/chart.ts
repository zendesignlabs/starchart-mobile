// Types derived from ~/Projects/editor-multiuser/01-DATA-MODELS.md

export type Planet =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'north_node'
  | 'chiron';

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type AspectType =
  | 'conjunction'
  | 'opposition'
  | 'trine'
  | 'square'
  | 'sextile'
  | 'quincunx'
  | 'semisquare'
  | 'sesquiquadrate';

export type LineType = 'AC' | 'DC' | 'MC' | 'IC';

export interface PlanetPosition {
  name: Planet;
  sign: ZodiacSign;
  house: number; // 1-12
  degree: number; // 0-29
  minute: number;
  longitude: number; // 0-360, absolute ecliptic longitude
  speed: number; // degrees/day, negative = retrograde
  retrograde: boolean;
}

export interface HouseCusp {
  house: number; // 1-12
  sign: ZodiacSign;
  degree: number;
  longitude: number; // 0-360
}

export interface Aspect {
  planet1: Planet;
  planet2: Planet;
  type: AspectType;
  orb: number; // degrees from exact
  applying: boolean;
}

export interface ChartAngles {
  ascendant: { sign: ZodiacSign; degree: number; minute: number };
  midheaven: { sign: ZodiacSign; degree: number; minute: number };
  descendant: { sign: ZodiacSign; degree: number; minute: number };
  imumCoeli: { sign: ZodiacSign; degree: number; minute: number };
}

export interface ChartData {
  calculatedAt: string; // ISO timestamp
  planets: PlanetPosition[];
  houses: HouseCusp[];
  angles: ChartAngles;
  aspects: Aspect[];
}

export interface AstrocartographyLine {
  planet: Planet;
  lineType: LineType;
  coordinates: [number, number][]; // pre-calculated [lng, lat] pairs
  color: string; // hex
  weight: number; // px
  dashed: boolean;
  label?: string; // override e.g. "Venus AC — creativity"
  visible: boolean;
}

export interface TransitAspect {
  transitPlanet: Planet;
  natalPlanet: Planet;
  type: AspectType;
  orb: number;
  applying: boolean;
  exactAt?: string; // ISO timestamp
}
