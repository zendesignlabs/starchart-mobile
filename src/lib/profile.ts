import AsyncStorage from '@react-native-async-storage/async-storage';
import tzLookup from 'tz-lookup';
import type { ActiveLocation, SavedLocation, StoredProfile } from '../types/profile';

export const PROFILE_KEY = '@starchart/profile';

export interface PlaceResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function normalizeChartData(profile: Pick<StoredProfile, 'chartData'>) {
  const chartData = profile.chartData;
  if (!chartData) return null;
  if ('chartData' in chartData) return chartData.chartData;
  return chartData;
}

export function birthLocation(profile: StoredProfile): ActiveLocation {
  return {
    label: 'Birth',
    place: profile.birthPlace,
    lat: profile.birthLat,
    lng: profile.birthLng,
    timezone: profile.birthTimezone,
    isBirth: true,
  };
}

export function getActiveLocation(profile: StoredProfile): ActiveLocation {
  const activeId = profile.activeLocationId;
  const relocation = activeId
    ? (profile.relocations ?? []).find((location) => location.id === activeId)
    : null;

  if (!relocation) return birthLocation(profile);

  return {
    id: relocation.id,
    label: relocation.name || 'Relocation',
    place: relocation.place,
    lat: relocation.lat,
    lng: relocation.lng,
    timezone: relocation.timezone,
    isBirth: false,
  };
}

export function newLocationFromPlace(place: PlaceResult, name?: string): SavedLocation | null {
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const displayName = place.display_name;
  return {
    id: `reloc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name?.trim() || displayName.split(',')[0]?.trim() || 'Relocation',
    place: displayName,
    lat,
    lng,
    timezone: tzLookup(lat, lng),
    createdAt: new Date().toISOString(),
  };
}

export function newPinnedLocation(lat: number, lng: number): SavedLocation {
  return {
    id: `reloc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: 'Pinned location',
    place: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    lat,
    lng,
    timezone: tzLookup(lat, lng),
    createdAt: new Date().toISOString(),
  };
}

export async function readProfile(): Promise<StoredProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function writeProfile(profile: StoredProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({
    ...profile,
    updatedAt: new Date().toISOString(),
    revision: Date.now(),
  }));
}

export async function updateProfile(mutator: (profile: StoredProfile) => StoredProfile): Promise<StoredProfile | null> {
  const profile = await readProfile();
  if (!profile) return null;
  const next = mutator(profile);
  await writeProfile(next);
  return next;
}
