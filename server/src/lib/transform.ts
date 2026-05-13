// Transforms ephemeris service responses to the shape expected by the mobile app.
// The service returns raw ecliptic data; the app wants sign/degree/minute breakdowns.

export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces'

export type Planet =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto'
  | 'north_node' | 'chiron'

export type LineType = 'AC' | 'DC' | 'MC' | 'IC'

const SIGNS: ZodiacSign[] = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
]

const PLANET_NAME_MAP: Record<string, Planet> = {
  Sun: 'sun', Moon: 'moon', Mercury: 'mercury', Venus: 'venus',
  Mars: 'mars', Jupiter: 'jupiter', Saturn: 'saturn', Uranus: 'uranus',
  Neptune: 'neptune', Pluto: 'pluto', Chiron: 'chiron', NNode: 'north_node',
}

const LINE_COLORS: Record<LineType, string> = {
  AC: '#FF6B9D',
  DC: '#BD00FF',
  MC: '#00A8FF',
  IC: '#00FF87',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeL(lon: number): number {
  return ((lon % 360) + 360) % 360
}

function lonToSign(lon: number): { sign: ZodiacSign; degree: number; minute: number } {
  const n = normalizeL(lon)
  const signIndex = Math.floor(n / 30)
  const withinSign = n % 30
  return {
    sign: SIGNS[signIndex],
    degree: Math.floor(withinSign),
    minute: Math.floor((withinSign % 1) * 60),
  }
}

function signIndex(lon: number): number {
  return Math.floor(normalizeL(lon) / 30)
}

function getWholeSignHouse(planetLon: number, ascLon: number): number {
  const ascSign = signIndex(ascLon)
  const planetSign = signIndex(planetLon)
  return ((planetSign - ascSign + 12) % 12) + 1
}

function wholeSignHouses(ascLon: number) {
  const ascSign = signIndex(ascLon)
  return Array.from({ length: 12 }, (_, i) => {
    const signStart = normalizeL((ascSign + i) * 30)
    return {
      house: i + 1,
      longitude: signStart,
      ...lonToSign(signStart),
    }
  })
}

// ─── Chart transformation ─────────────────────────────────────────────────────

interface EphemerisPosition {
  name: string
  longitude: number
  latitude: number
  speed: number
  retrograde: boolean
}

interface EphemerisHouses {
  cusps: number[]  // 12 cusp longitudes
  asc: number
  mc: number
}

interface EphemerisAspect {
  planet1: string
  planet2: string
  type: string
  orb: number
}

export interface ChartData {
  calculatedAt: string
  planets: ReturnType<typeof transformPlanets>
  houses: ReturnType<typeof transformHouses>
  angles: ReturnType<typeof transformAngles>
  aspects: ReturnType<typeof transformAspects>
}

export function transformPlanets(positions: EphemerisPosition[], houses: EphemerisHouses) {
  return positions.map((p) => ({
    name: PLANET_NAME_MAP[p.name] ?? (p.name.toLowerCase() as Planet),
    ...lonToSign(p.longitude),
    house: getWholeSignHouse(p.longitude, houses.asc),
    longitude: p.longitude,
    speed: p.speed,
    retrograde: p.retrograde,
  }))
}

export function transformHouses(houses: EphemerisHouses) {
  return wholeSignHouses(houses.asc)
}

export function transformAngles(houses: EphemerisHouses) {
  return {
    ascendant: lonToSign(houses.asc),
    midheaven: lonToSign(houses.mc),
    descendant: lonToSign(normalizeL(houses.asc + 180)),
    imumCoeli: lonToSign(normalizeL(houses.mc + 180)),
  }
}

export function transformAspects(aspects: EphemerisAspect[]) {
  return aspects.map((a) => ({
    planet1: PLANET_NAME_MAP[a.planet1] ?? (a.planet1.toLowerCase() as Planet),
    planet2: PLANET_NAME_MAP[a.planet2] ?? (a.planet2.toLowerCase() as Planet),
    type: a.type as any,
    orb: Math.abs(a.orb),
    applying: false, // natal chart aspects have no applying direction
  }))
}

// ─── ACG line transformation ──────────────────────────────────────────────────

type AcgLinesRaw = Record<string, Array<[number, number]>>

export function transformAcgLines(raw: AcgLinesRaw) {
  return Object.entries(raw)
    .map(([key, coords]) => {
      const parts = key.split('_')
      if (parts.length !== 2) return null
      const [planetName, lineType] = parts
      const planet = PLANET_NAME_MAP[planetName]
      if (!planet || !['AC', 'DC', 'MC', 'IC'].includes(lineType)) return null
      return {
        planet,
        lineType: lineType as LineType,
        coordinates: coords,
        color: LINE_COLORS[lineType as LineType],
        weight: 2,
        dashed: false,
        visible: true,
      }
    })
    .filter(Boolean)
}

// ─── Transit transformation ───────────────────────────────────────────────────

interface EphemerisTransitAspect {
  transitingPlanet: string
  natalPlanet: string
  type: string
  orb: number
  direction: 'applying' | 'separating' | null
  natalHouse: number | null
}

export function transformTransits(aspects: EphemerisTransitAspect[]) {
  return aspects.map((a) => ({
    transitPlanet: PLANET_NAME_MAP[a.transitingPlanet] ?? (a.transitingPlanet.toLowerCase() as Planet),
    natalPlanet: PLANET_NAME_MAP[a.natalPlanet] ?? (a.natalPlanet.toLowerCase() as Planet),
    type: a.type as any,
    orb: Math.abs(a.orb),
    applying: a.direction === 'applying',
  }))
}
