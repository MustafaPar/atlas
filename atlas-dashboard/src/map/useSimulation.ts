import { useRef, useState, useEffect, useCallback } from 'react'
import { generateMockRoute, positionAlongRoute, legSeed } from './mockRouting'
import type { Route } from './mockRouting'

export type SimPhase =
  | 'to_pickup'
  | 'at_pickup'
  | 'to_delivery'
  | 'at_delivery'
  | 'done'

export interface SimState {
  courierId: string
  orderId: string
  assignmentId: string
  vehicleType: string
  phase: SimPhase
  lat: number
  lng: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  deliveryLat: number
  deliveryLng: number
  route: Route         // generated waypoints for the current movement leg
  progress: number     // 0–1 within the current movement leg
  startTime: number    // epoch ms; shifted forward on resume
  paused: boolean
  pausedAt: number | null
  speedKmh: number     // simulated display speed
  etaSeconds: number   // seconds remaining in the current leg
}

export interface StartSimParams {
  orderId: string
  courierId: string
  assignmentId: string
  vehicleType?: string
  courierLat: number
  courierLng: number
  pickupLat: number
  pickupLng: number
  deliveryLat: number
  deliveryLng: number
  /** Pre-fetched road route; falls back to offline mock when omitted. */
  route?: Route
}

// Duration of each movement leg.
const LEG_DURATION_MS = 20_000

// Realistic display speeds per vehicle type (km/h).
const VEHICLE_SPEED_KMH: Record<string, number> = {
  BIKE:       14,
  MOTORCYCLE: 32,
  CAR:        28,
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function useSimulation() {
  // Mutable entries read inside the rAF callback — avoids stale closures.
  const entriesRef = useRef<Record<string, SimState>>({})
  const rafRef     = useRef<number | null>(null)

  // Immutable snapshot pushed to React state on every tick for re-renders.
  const [simMap, setSimMap] = useState<Record<string, SimState>>({})

  const sync = useCallback(() => {
    const snapshot: Record<string, SimState> = {}
    for (const [k, v] of Object.entries(entriesRef.current)) {
      snapshot[k] = { ...v }
    }
    setSimMap(snapshot)
  }, [])

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const entries = entriesRef.current
    let hasMoving = false

    for (const s of Object.values(entries)) {
      if (s.paused || (s.phase !== 'to_pickup' && s.phase !== 'to_delivery')) continue

      hasMoving = true
      const raw = (Date.now() - s.startTime) / LEG_DURATION_MS
      const t   = Math.min(raw, 1)
      const e   = easeInOut(t)

      const pos    = positionAlongRoute(s.route, e)
      s.lat        = pos.lat
      s.lng        = pos.lng
      s.progress   = t
      s.etaSeconds = Math.max(0, (1 - t) * LEG_DURATION_MS / 1000)

      if (t >= 1) {
        s.lat        = s.toLat
        s.lng        = s.toLng
        s.phase      = s.phase === 'to_pickup' ? 'at_pickup' : 'at_delivery'
        s.progress   = 1
        s.etaSeconds = 0
      }
    }

    sync()

    if (hasMoving) {
      rafRef.current = requestAnimationFrame(tick)
    } else {
      rafRef.current = null
    }
  }, [sync])

  // Start the rAF loop if not already running.
  const ensureRaf = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  const startSimulation = useCallback((p: StartSimParams) => {
    const base  = VEHICLE_SPEED_KMH[p.vehicleType ?? 'CAR'] ?? 25
    // Add ±15% variation so couriers don't all move identically.
    const speedKmh = base * (0.85 + Math.random() * 0.3)

    const fromPt   = { lat: p.courierLat, lng: p.courierLng }
    const pickupPt = { lat: p.pickupLat,  lng: p.pickupLng }
    const route    = p.route ?? generateMockRoute(fromPt, pickupPt, legSeed(fromPt, pickupPt))

    entriesRef.current[p.courierId] = {
      courierId:    p.courierId,
      orderId:      p.orderId,
      assignmentId: p.assignmentId,
      vehicleType:  p.vehicleType ?? 'CAR',
      phase:        'to_pickup',
      lat:          p.courierLat,
      lng:          p.courierLng,
      fromLat:      p.courierLat,
      fromLng:      p.courierLng,
      toLat:        p.pickupLat,
      toLng:        p.pickupLng,
      deliveryLat:  p.deliveryLat,
      deliveryLng:  p.deliveryLng,
      route,
      progress:     0,
      startTime:    Date.now(),
      paused:       false,
      pausedAt:     null,
      speedKmh,
      etaSeconds:   LEG_DURATION_MS / 1000,
    }
    sync()
    ensureRaf()
  }, [sync, ensureRaf])

  const confirmPickup = useCallback((courierId: string, delivRoute?: Route) => {
    const s = entriesRef.current[courierId]
    if (!s || s.phase !== 'at_pickup') return
    const fromPt    = { lat: s.lat,         lng: s.lng }
    const delivPt   = { lat: s.deliveryLat, lng: s.deliveryLng }
    s.phase      = 'to_delivery'
    s.fromLat    = s.lat
    s.fromLng    = s.lng
    s.toLat      = s.deliveryLat
    s.toLng      = s.deliveryLng
    s.route      = delivRoute ?? generateMockRoute(fromPt, delivPt, legSeed(fromPt, delivPt))
    s.progress   = 0
    s.startTime  = Date.now()
    s.paused     = false
    s.pausedAt   = null
    s.etaSeconds = LEG_DURATION_MS / 1000
    sync()
    ensureRaf()
  }, [sync, ensureRaf])

  const confirmDelivery = useCallback((courierId: string) => {
    const s = entriesRef.current[courierId]
    if (!s || s.phase !== 'at_delivery') return
    s.phase      = 'done'
    s.etaSeconds = 0
    sync()
    // rAF self-terminates when no moving entries remain.
  }, [sync])

  const pauseSimulation = useCallback((courierId: string) => {
    const s = entriesRef.current[courierId]
    if (!s || s.paused || (s.phase !== 'to_pickup' && s.phase !== 'to_delivery')) return
    s.paused   = true
    s.pausedAt = Date.now()
    sync()
    // rAF self-terminates when it sees this entry is paused and no others are moving.
  }, [sync])

  const resumeSimulation = useCallback((courierId: string) => {
    const s = entriesRef.current[courierId]
    if (!s || !s.paused || s.pausedAt === null) return
    // Shift startTime forward by the pause duration so progress resumes from where it stopped.
    s.startTime += Date.now() - s.pausedAt
    s.paused    = false
    s.pausedAt  = null
    sync()
    ensureRaf()
  }, [sync, ensureRaf])

  const stopSimulation = useCallback((courierId?: string) => {
    if (courierId) {
      delete entriesRef.current[courierId]
    } else {
      entriesRef.current = {}
    }
    sync()
    // rAF self-terminates on the next frame when no active entries are found.
  }, [sync])

  useEffect(() => () => cancelRaf(), [cancelRaf])

  const simulatingOrderIds = new Set(Object.values(simMap).map((s) => s.orderId))
  const activeCount = Object.keys(simMap).length

  return {
    simMap,
    activeCount,
    simulatingOrderIds,
    startSimulation,
    confirmPickup,
    confirmDelivery,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
  }
}
