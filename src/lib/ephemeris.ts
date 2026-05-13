import axios from 'axios';
import type { ChartData, AstrocartographyLine, TransitAspect } from '../types/chart';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? 'https://mobile.starchart.now'}/api/ephemeris`;

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export async function calculateChart(
  datetime: string,
  lat: number,
  lng: number
): Promise<ChartData> {
  const response = await client.post<ChartData>('/chart', {
    datetime,
    lat,
    lng,
    houseSystem: 'P',
  });
  return response.data;
}

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

export async function getTransitsToNatal(
  natalDatetime: string,
  natalLat: number,
  natalLng: number,
  momentUTC?: string
): Promise<TransitAspect[]> {
  const response = await client.post<{ aspects: TransitAspect[] }>('/transits-to-natal', {
    natalDatetime,
    natalLat,
    natalLng,
    momentUTC: momentUTC ?? new Date().toISOString(),
  });
  return response.data.aspects;
}
