import axios from 'axios';
import type { ChartData, AstrocartographyLine, TransitAspect, Planet } from '../types/chart';
import { transformRawChart } from './transform';

const BASE_URL = `${process.env.EXPO_PUBLIC_API_URL ?? 'https://mobile.starchart.now'}/api/ephemeris`;

const client = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

type ChartResponse = ChartData | {
  chartData: ChartData;
  acgLines?: AstrocartographyLine[];
} | {
  positions?: unknown[];
  houses?: unknown;
  aspects?: unknown[];
  acgLines?: Record<string, Array<[number, number]>>;
  calculatedAt?: string;
};

function unwrapChartResponse(data: ChartResponse): { chartData: ChartData; acgLines: AstrocartographyLine[] } {
  if ('chartData' in data) {
    return {
      chartData: data.chartData,
      acgLines: Array.isArray(data.acgLines) ? data.acgLines : [],
    };
  }
  if ('positions' in data || 'houses' in data) {
    return transformRawChart(data as Parameters<typeof transformRawChart>[0]);
  }
  return { chartData: data as ChartData, acgLines: [] };
}

function servicePlanetName(planet: Planet): string {
  const map: Record<Planet, string> = {
    sun: 'Sun',
    moon: 'Moon',
    mercury: 'Mercury',
    venus: 'Venus',
    mars: 'Mars',
    jupiter: 'Jupiter',
    saturn: 'Saturn',
    uranus: 'Uranus',
    neptune: 'Neptune',
    pluto: 'Pluto',
    north_node: 'NNode',
    chiron: 'Chiron',
  };
  return map[planet];
}

async function calculateChartBundle(
  datetime: string,
  lat: number,
  lng: number
): Promise<{ chartData: ChartData; acgLines: AstrocartographyLine[] }> {
  const response = await client.post<ChartResponse>('/chart', {
    datetime,
    birthUTC: datetime,
    lat,
    lng,
    houseSystem: 'P',
  });
  return unwrapChartResponse(response.data);
}

export async function calculateChart(
  datetime: string,
  lat: number,
  lng: number
): Promise<ChartData> {
  const { chartData } = await calculateChartBundle(datetime, lat, lng);
  return chartData;
}

export async function calculateACGLines(
  datetime: string,
  lat: number,
  lng: number
): Promise<AstrocartographyLine[]> {
  const { acgLines } = await calculateChartBundle(datetime, lat, lng);
  return acgLines;
}

export async function getTransitsToNatal(
  natalDatetime: string,
  natalLat: number,
  natalLng: number,
  momentUTC?: string
): Promise<TransitAspect[]> {
  const { chartData } = await calculateChartBundle(natalDatetime, natalLat, natalLng);
  const natalPositions = (Array.isArray(chartData.planets) ? chartData.planets : []).map((p) => ({
    name: servicePlanetName(p.name),
    longitude: p.longitude,
  }));

  if (natalPositions.length === 0) return [];

  const response = await client.post<{ aspects?: TransitAspect[] }>('/transits-to-natal', {
    natalPositions,
    momentUTC: momentUTC ?? new Date().toISOString(),
  });
  return Array.isArray(response.data.aspects) ? response.data.aspects : [];
}
