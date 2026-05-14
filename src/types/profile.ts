import type { ChartData } from './chart';

export interface SavedLocation {
  id: string;
  name: string;
  place: string;
  lat: number;
  lng: number;
  timezone: string;
  createdAt: string;
}

export interface RelocatedChartCacheEntry {
  chartData: ChartData;
  calculatedFor: string;
  lat: number;
  lng: number;
  updatedAt: string;
}

export interface StoredProfile {
  name: string;
  birthDatetime: string;
  birthPlace: string;
  birthLat: number;
  birthLng: number;
  birthLocalDate?: string;
  birthLocalTime?: string;
  birthTimezone?: string;
  timeUnknown?: boolean;
  chartData: ChartData | { chartData: ChartData };
  chartCalculatedFor?: string;
  relocations?: SavedLocation[];
  activeLocationId?: string;
  relocatedCharts?: Record<string, RelocatedChartCacheEntry>;
  createdAt?: string;
  updatedAt?: string;
  revision?: number;
}

export interface ActiveLocation {
  id?: string;
  label: string;
  place: string;
  lat: number;
  lng: number;
  timezone?: string;
  isBirth: boolean;
}
