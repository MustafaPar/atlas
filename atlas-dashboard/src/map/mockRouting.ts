/**
 * Offline mock routing for simulation.
 *
 * Generates city-like routes between two points by inserting intermediate
 * waypoints with perpendicular deviations that alternate left/right of the
 * direct line, approximating the zig-zag of a block-based street grid.
 * No external API or network request is used. Output is fully deterministic
 * for a given from/to pair.
 */

export interface LatLng {
  lat: number
  lng: number
}

export interface Route {
  waypoints: LatLng[]
  /** Cumulative segment-length sum at each waypoint; cumDist[0] === 0. */
  cumDist: number[]
  totalDist: number
}

function segDist(a: LatLng, b: LatLng): number {
  const dlat = b.lat - a.lat
  const dlng = b.lng - a.lng
  return Math.sqrt(dlat * dlat + dlng * dlng)
}

/** Deterministic hash-based PRNG — no state, no side effects. */
function seededRng(seed: number): number {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

/** Build a Route from a pre-computed waypoint array. */
export function buildRoute(waypoints: LatLng[]): Route {
  const cumDist: number[] = [0]
  for (let i = 1; i < waypoints.length; i++) {
    cumDist.push(cumDist[i - 1] + segDist(waypoints[i - 1], waypoints[i]))
  }
  return { waypoints, cumDist, totalDist: cumDist[cumDist.length - 1] }
}

/**
 * Returns the position at fractional distance t ∈ [0, 1] along the route.
 * Segments are traversed at constant speed (proportional to their length),
 * so the courier moves faster on long street segments and slower on short ones.
 */
export function positionAlongRoute(route: Route, t: number): LatLng {
  const wps = route.waypoints
  if (wps.length === 1) return wps[0]

  const target = Math.min(Math.max(t, 0), 1) * route.totalDist

  // Walk forward until we find the segment that contains `target`.
  let i = 1
  while (i < route.cumDist.length - 1 && route.cumDist[i] < target) i++

  const a = wps[i - 1]
  const b = wps[i]
  const segLen = route.cumDist[i] - route.cumDist[i - 1]
  const u = segLen > 0 ? (target - route.cumDist[i - 1]) / segLen : 0

  return {
    lat: a.lat + (b.lat - a.lat) * u,
    lng: a.lng + (b.lng - a.lng) * u,
  }
}

/**
 * Generates a mock city route between `from` and `to`.
 *
 * Algorithm:
 *  1. Compute the perpendicular unit vector of the direct line.
 *  2. Place 2–6 intermediate waypoints along the line at even intervals.
 *  3. Offset each waypoint perpendicularly, alternating left/right.
 *  4. Apply a bell-curve envelope (sin(t·π)) so deviations taper at endpoints.
 *  5. Add a seeded random magnitude variation (±50%) so routes differ visually.
 *
 * @param seed  Deterministic value derived from the leg's start/end coords.
 *              Same seed → same route, so resumed/replayed legs are stable.
 */
export function generateMockRoute(from: LatLng, to: LatLng, seed: number): Route {
  const dlat = to.lat - from.lat
  const dlng = to.lng - from.lng
  const straightDist = Math.sqrt(dlat * dlat + dlng * dlng)

  // Very short legs — no deviation worth adding.
  if (straightDist < 0.002) return buildRoute([from, to])

  // Scale number of intermediate waypoints with distance (2–6).
  const numIntermediate = Math.min(6, Math.max(2, Math.round(straightDist / 0.007)))

  // Perpendicular unit vector (direct vector rotated 90°).
  const perpLat = -dlng / straightDist
  const perpLng =  dlat / straightDist

  // Deviation magnitude: 18% of leg length, hard-capped at ≈450 m equivalent.
  const maxDev = Math.min(straightDist * 0.18, 0.0045)

  const pts: LatLng[] = [from]

  for (let i = 1; i <= numIntermediate; i++) {
    const t = i / (numIntermediate + 1)

    // Bell-curve envelope peaks at t=0.5 → deviations taper toward endpoints.
    const envelope  = Math.sin(t * Math.PI)
    const side      = i % 2 === 0 ? 1 : -1
    const magnitude = envelope * maxDev * (0.5 + 0.5 * seededRng(seed + i * 91.37))

    pts.push({
      lat: from.lat + dlat * t + perpLat * side * magnitude,
      lng: from.lng + dlng * t + perpLng * side * magnitude,
    })
  }

  pts.push(to)
  return buildRoute(pts)
}

/** Derives a stable numeric seed from a leg's start and end coordinates. */
export function legSeed(from: LatLng, to: LatLng): number {
  return from.lat * 73856 + from.lng * 19349 + to.lat * 12893 + to.lng * 7489
}
