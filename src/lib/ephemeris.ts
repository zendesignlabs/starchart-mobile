import axios from 'axios';
import type { ChartData, AstrocartographyLine, TransitAspect } from '../types/chart';

const BASE_URL = process.env.EXPO_PUBLIC_EPHEMERIS_URL ?? '';
const API_KEY = process.env.EXPO_PUBLIC_EPHEMERIS_KEY ?? '';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': API_KEY,
  },
  timeout: 15000,
});

/**
 * Calculate a natal chart for a given birth datetime and location.
 * Matches the ephemeris service POST /chart endpoint.
 */
export async function calculateChart(
  datetime: string,
  lat: number,
  lng: number
): Promise<ChartData> {
  const response = await client.post<ChartData>('/chart', {
    datetime,
    lat,
    lng,
    houseSystem: 'P', // Placidus
  });
  return response.data;
}

/**
 * Calculate astrocartography lines for a natal chart.
 * Matches the ephemeris service POST /astrocartography endpoint.
 */
export async function calculateACGLines(
  datetime: string,
  lat: number,
  lng: number
): Promise<AstrocartographyLine[]> {
  const response = await client.post<{ lines: AstrocartographyLine[] }>(
    '/astrocartography',
    { datetime, lat, lng }
  );
  return response.data.lines;
}

/**
 * Get transits to a natal chart for a given moment.
 * If momentUTC is omitted, the current time is used.
 */
export async function getTransitsToNatal(
  natalDatetime: string,
  natalLat: number,
  natalLng: number,
  momentUTC?: string
): Promise<TransitAspect[]> {
  const response = await client.post<{ aspects: TransitAspect[] }>('/transits', {
    natalDatetime,
    natalLat,
    natalLng,
    momentUTC: momentUTC ?? new Date().toISOString(),
  });
  return response.data.aspects;
}
