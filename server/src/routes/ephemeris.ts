import { Hono } from 'hono'
import {
  transformPlanets,
  transformHouses,
  transformAngles,
  transformAspects,
  transformAcgLines,
  transformTransits,
} from '../lib/transform.js'

export const ephemerisRouter = new Hono()

const EPHEMERIS_URL = process.env.EPHEMERIS_URL ?? 'https://ephemeris.zendesignlabs.com'
const EPHEMERIS_KEY = process.env.EPHEMERIS_KEY ?? ''

async function callEphemeris(path: string, body: unknown) {
  const res = await fetch(`${EPHEMERIS_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EPHEMERIS_KEY,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ephemeris ${path} failed: ${res.status} ${text}`)
  }
  return res.json()
}

// POST /api/ephemeris/chart
// Body: { datetime: ISO string, lat: number, lng: number }
// Returns: { chartData: ChartData, acgLines: AstrocartographyLine[] }
// Combined call — natal chart + ACG lines come from the same service endpoint.
ephemerisRouter.post('/chart', async (c) => {
  const { datetime, lat, lng } = await c.req.json<{
    datetime: string
    lat: number
    lng: number
  }>()

  try {
    const raw = await callEphemeris('/chart', { birthUTC: datetime, lat, lng }) as any

    const chartData = {
      calculatedAt: raw.calculatedAt,
      planets: transformPlanets(raw.positions, raw.houses),
      houses: transformHouses(raw.houses),
      angles: transformAngles(raw.houses),
      aspects: transformAspects(raw.aspects),
    }
    const acgLines = transformAcgLines(raw.acgLines ?? {})

    return c.json({ chartData, acgLines })
  } catch (err: any) {
    console.error('Chart proxy error:', err.message)
    return c.json({ error: 'Failed to calculate chart' }, 500)
  }
})

// POST /api/ephemeris/transits-to-natal
// Body: { natalPositions: [{ name: "Sun", longitude: 47.4 }, ...], momentUTC?: ISO }
// natalPositions uses the service's name format (capitalized: "Sun", "NNode").
// Returns: { aspects: TransitAspect[] }
ephemerisRouter.post('/transits-to-natal', async (c) => {
  const { natalPositions, momentUTC } = await c.req.json<{
    natalPositions: Array<{ name: string; longitude: number }>
    momentUTC?: string
  }>()

  try {
    const raw = await callEphemeris('/transits-to-natal', {
      natalPositions,
      momentUTC: momentUTC ?? new Date().toISOString(),
      orb: 3.0,
    }) as any

    const aspects = transformTransits(raw.aspects ?? [])
    return c.json({ aspects })
  } catch (err: any) {
    console.error('Transits proxy error:', err.message)
    return c.json({ error: 'Failed to calculate transits' }, 500)
  }
})
