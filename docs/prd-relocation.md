# PRD: Relocational Astrology

**Owner:** Zen
**Implementer:** Pip
**Status:** Draft
**Date:** 2026-05-13

## Summary

Add relocational astrology to Starchart. Users can recalculate their natal chart "as if" they had been born at another location, save multiple relocations, and switch which location drives the Map, Chart, and Lines screens. Natal planetary positions are immutable; only houses, angles (AC/MC/DC/IC), and house-based aspects change with location.

## Why

Astrocartography (already shipped) tells users *where* planetary energies fall on a map. Relocation is the natural next step: it answers "what does my chart actually look like *in that city*?" Power users — the audience most likely to subscribe — expect this. It also unlocks a clear comparison UX (birth vs. current city) that maps cleanly onto the existing tab structure without inventing new surfaces.

## Goals

1. Let a user add, name, and persist one or more relocation places.
2. Let a user switch the "active location" used by the Chart, Map, and Lines screens.
3. Recompute houses, angles, and any location-dependent aspects/transits for the active location while preserving original natal planet positions.
4. Make it visually obvious when the user is viewing a relocated chart vs. their birth chart.

## Non-goals

- Synastry between two people.
- Side-by-side dual-chart overlay (a v2 nice-to-have, not v1).
- Travel/itinerary planning, "best city for love" recommendations.
- Backend persistence — relocations stay in AsyncStorage alongside the existing profile.

## Background

The existing data model ([src/types/chart.ts](src/types/chart.ts), profile shape documented in stored `@starchart/profile`) keys everything off `birthDatetime`, `birthLat`, `birthLng`. The chart endpoint at [server/src/routes/ephemeris.ts](server/src/routes/ephemeris.ts) — `POST /api/ephemeris/chart` — already takes `datetime`, `lat`, `lng` as inputs. **The server contract does not need to change.** Relocation is simply: call the same endpoint with `birthDatetime` + relocated `lat`/`lng`, discard the returned planet positions (they'll be identical to natal anyway, since planets depend on time not place), and keep the returned houses + angles.

> Implementation note for Pip: confirm the ephemeris service returns identical ecliptic longitudes for planets when only lat/lng change. If it doesn't (e.g. topocentric corrections), explicitly overwrite planet positions with the natal ones before caching.

## User stories

1. *As a user, I tap the location chip in the header and add "Berlin" as a relocation. The map, chart, and lines update to Berlin's perspective.*
2. *As a user, I switch back to my birth location with one tap.*
3. *As a user, I can rename or delete a saved relocation from Settings.*
4. *As a user viewing a relocated chart, I can see at a glance that this is not my birth chart.*

## UX

### Active-location switcher

A pill/chip in the header of the Map, Chart, and Lines screens. Tapping opens a bottom sheet listing:
- **Birth** — `birthPlace` (always first, cannot be deleted)
- Each saved relocation
- **+ Add location** — opens the existing place-search component already used on the Map screen ([app/(app)/index.tsx](app/(app)/index.tsx), Nominatim search).

The active location is reflected by a checkmark and by the chip label itself. When a non-birth location is active, the chip uses an accent color so the "I'm in relocation mode" state is unambiguous.

### Chart screen

When relocated:
- Heading shows e.g. *"Relocated to Berlin"* under the existing birth-time heading.
- Angles (AC/MC/DC/IC) and house cusps update.
- Planet sign/degree stays the same; the **house** column updates.
- Aspects list is unchanged (planet-to-planet aspects don't depend on location). House placements within aspect rows do.

### Map screen

When relocated:
- ACG lines remain the natal ACG lines (these are inherently global and tied to birth moment — they do not "move" with relocation).
- The map centers on the active location, not birth location.
- A subtle banner clarifies: *"Showing natal astrocartography. Houses on Chart tab are relocated to Berlin."* This pre-empts the most likely user confusion.

### Lines screen

No change to the 48 lines themselves. Add the location chip in the header for consistency, but tapping a non-birth location just changes which location is "active" for the Chart tab.

### Settings

New section: **Saved locations**. Lists each relocation with rename / delete actions. Birth location is shown but only editable through the existing birth-data editor.

## Data model

Extend the stored profile (AsyncStorage key `@starchart/profile`):

```ts
type SavedLocation = {
  id: string;          // uuid
  name: string;        // user-facing label, defaults to place name
  place: string;       // search result display string
  lat: number;
  lng: number;
  timezone: string;    // resolved via tz-lookup; needed if we ever surface "local time at this place"
  createdAt: string;
};

type StoredProfile = {
  // ...existing fields unchanged
  relocations?: SavedLocation[];
  activeLocationId?: string;  // undefined = birth
};
```

`activeLocationId` is the single source of truth for which location drives the UI. Persist it so the app reopens in the user's last-viewed location.

## Calculation & caching

- Add `getRelocatedChart(profile, locationId)` in [src/lib/ephemeris.ts](src/lib/ephemeris.ts).
- Cache relocated chart data per `(birthDatetime, lat, lng)` tuple in the profile (similar to the existing `chartCalculatedFor` field). Suggested shape: a `relocatedCharts: Record<locationId, ChartData>` map.
- Invalidate the cache if birth data changes.
- Transits-to-natal does **not** need relocation: transits are planet-to-planet and time-driven. Skip.

## Edge cases

- **Birth time unknown** (`timeUnknown: true`): houses are already a noon-default approximation. Relocation still works but houses remain low-confidence. Surface the existing "time unknown" caveat on the relocated chart heading too.
- **Offline / network failure** when fetching a relocated chart: show a retry state, do not corrupt the profile.
- **Deleting the active relocation**: fall back to birth location.

## Subscription gating

**Ungated in v1.** All users can add unlimited relocations. Revisit gating once usage data is in.

## House system

**Whole sign, always.** Starchart uses whole sign houses throughout — this is Zen's house system of choice and is the default across all his products. Relocated charts use whole sign regardless of whether birth time is known. No new setting, no per-location override.

## Long-press to relocate

**Ships in v1.** On the Map screen, a long-press anywhere on the map sets a temporary "Pinned location" as the active relocation and centers the map there. The user is prompted (inline action sheet or toast with "Save") to name and persist it; if they don't save, the pin clears when they switch away. Long-press should not interfere with existing map gestures — confirm `react-native-maps` `onLongPress` doesn't conflict with the line-tap handlers.

## Acceptance criteria

- [ ] User can add a relocation from the Map, Chart, or Lines screen via a header chip.
- [ ] Switching active location updates the Chart tab's angles and house cusps within one network round-trip, with a loading state.
- [ ] Planet sign/degree on the Chart tab is byte-identical between birth and relocated views.
- [ ] House column on the Chart tab differs between birth and a relocation more than ~500 km away.
- [ ] Settings shows all saved locations; rename and delete work and persist across app restarts.
- [ ] App relaunches in the last-active location.
- [ ] Banner appears on the Map screen when a relocation is active.
- [ ] Birth location cannot be deleted.

## Out of scope / follow-ups

- Side-by-side birth vs. relocated chart overlay.
- Sharing a relocated chart.
- Subscription gating (revisit post-launch).
