/**
 * Road-following route resolution for the simulation layer.
 *
 * Primary:  OSRM public demo API — returns real road geometry.
 * Fallback: offline mock route generator (perpendicular-deviation waypoints).
 *
 * Results are cached in memory for the session so repeated starts on the
 * same leg never fire a second network request.
 *
 * No API key is required. OSRM coordinates are [lng, lat]; the app uses
 * { lat, lng } — the conversion happens here so callers never see the flip.
 */

import { generateMockRoute, buildRoute, legSeed } from './mockRouting'
import type { LatLng, Route } from './mockRouting'

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'
const TIMEOUT_MS = 6000

const routeCache = new Map<string, Route>()

function cacheKey(from: LatLng, to: LatLng): string {
  // Round to ~11 m precision — avoids cache misses from floating-point drift.
  return `${from.lat.toFixed(4)},${from.lng.toFixed(4)};${to.lat.toFixed(4)},${to.lng.toFixed(4)}`
}

/**
 * Fetches a road-following route from the OSRM public demo server.
 * Falls back silently to the offline mock generator on any failure.
 * Results are cached for the lifetime of the browser tab.
 */
export async function fetchRoute(from: LatLng, to: LatLng): Promise<Route> {
  const key = cacheKey(from, to)
  const hit = routeCache.get(key)
  if (hit) return hit

  try {
    // OSRM expects coordinates as lng,lat pairs separated by semicolons.
    const url =
      `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}` +
      `?overview=full&geometries=geojson`

    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`)

    const json = await res.json()
    if (!json.routes?.length) throw new Error('OSRM: no routes returned')

    // GeoJSON coordinates are [lng, lat]; convert to { lat, lng }.
    const coords: [number, number][] = json.routes[0].geometry.coordinates
    const waypoints: LatLng[] = coords.map(([lng, lat]) => ({ lat, lng }))

    const route = buildRoute(waypoints)
    routeCache.set(key, route)
    return route

  } catch {
    // Network error, timeout, or unexpected response — use offline fallback.
    const fallback = generateMockRoute(from, to, legSeed(from, to))
    // Cache the fallback so the same leg is consistent within this session.
    routeCache.set(key, fallback)
    return fallback
  }
}
