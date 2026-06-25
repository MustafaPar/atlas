import { useRef, useState, useEffect, useCallback } from 'react'

export type SimPhase =
  | 'to_pickup'
  | 'at_pickup'
  | 'to_delivery'
  | 'at_delivery'
  | 'done'

export interface SimState {
  orderId: string
  courierId: string
  assignmentId: string
  phase: SimPhase
  lat: number
  lng: number
  fromLat: number
  fromLng: number
  toLat: number
  toLng: number
  progress: number    // 0–1 within the current leg
  startTime: number   // epoch ms; adjusted forward on resume
  paused: boolean
  pausedAt: number | null
}

export interface StartSimParams {
  orderId: string
  courierId: string
  assignmentId: string
  courierLat: number
  courierLng: number
  pickupLat: number
  pickupLng: number
  deliveryLat: number
  deliveryLng: number
}

// Duration of each movement leg in ms.
const LEG_DURATION_MS = 20_000

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

export function useSimulation() {
  const stateRef    = useRef<SimState | null>(null)
  const deliveryRef = useRef<{ lat: number; lng: number } | null>(null)
  const rafRef      = useRef<number | null>(null)

  const [sim, setSim] = useState<SimState | null>(null)

  const sync = useCallback(() =>
    setSim(stateRef.current ? { ...stateRef.current } : null), [])

  const cancelRaf = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const tick = useCallback(() => {
    const s = stateRef.current
    if (!s || s.paused || (s.phase !== 'to_pickup' && s.phase !== 'to_delivery')) return

    const raw = (Date.now() - s.startTime) / LEG_DURATION_MS
    const t   = Math.min(raw, 1)
    const e   = easeInOut(t)

    s.lat      = s.fromLat + (s.toLat - s.fromLat) * e
    s.lng      = s.fromLng + (s.toLng - s.fromLng) * e
    s.progress = t

    if (t >= 1) {
      s.lat   = s.toLat
      s.lng   = s.toLng
      s.phase = s.phase === 'to_pickup' ? 'at_pickup' : 'at_delivery'
      sync()
      return
    }

    sync()
    rafRef.current = requestAnimationFrame(tick)
  }, [sync])

  const startLeg = useCallback(() => {
    cancelRaf()
    rafRef.current = requestAnimationFrame(tick)
  }, [cancelRaf, tick])

  const startSimulation = useCallback((p: StartSimParams) => {
    cancelRaf()
    deliveryRef.current = { lat: p.deliveryLat, lng: p.deliveryLng }
    stateRef.current = {
      orderId:      p.orderId,
      courierId:    p.courierId,
      assignmentId: p.assignmentId,
      phase:        'to_pickup',
      lat:          p.courierLat,
      lng:          p.courierLng,
      fromLat:      p.courierLat,
      fromLng:      p.courierLng,
      toLat:        p.pickupLat,
      toLng:        p.pickupLng,
      progress:     0,
      startTime:    Date.now(),
      paused:       false,
      pausedAt:     null,
    }
    sync()
    startLeg()
  }, [cancelRaf, sync, startLeg])

  const confirmPickup = useCallback(() => {
    const s = stateRef.current
    if (!s || s.phase !== 'at_pickup') return
    const delivery = deliveryRef.current
    if (!delivery) return
    s.phase     = 'to_delivery'
    s.fromLat   = s.lat
    s.fromLng   = s.lng
    s.toLat     = delivery.lat
    s.toLng     = delivery.lng
    s.progress  = 0
    s.startTime = Date.now()
    s.paused    = false
    s.pausedAt  = null
    sync()
    startLeg()
  }, [sync, startLeg])

  const confirmDelivery = useCallback(() => {
    const s = stateRef.current
    if (!s || s.phase !== 'at_delivery') return
    s.phase = 'done'
    sync()
    cancelRaf()
  }, [sync, cancelRaf])

  const pauseSimulation = useCallback(() => {
    const s = stateRef.current
    if (!s || s.paused || (s.phase !== 'to_pickup' && s.phase !== 'to_delivery')) return
    cancelRaf()
    s.paused   = true
    s.pausedAt = Date.now()
    sync()
  }, [cancelRaf, sync])

  const resumeSimulation = useCallback(() => {
    const s = stateRef.current
    if (!s || !s.paused || s.pausedAt === null) return
    // Shift startTime forward by the pause duration so progress continues from where it stopped.
    s.startTime += Date.now() - s.pausedAt
    s.paused    = false
    s.pausedAt  = null
    sync()
    startLeg()
  }, [sync, startLeg])

  const stopSimulation = useCallback(() => {
    cancelRaf()
    stateRef.current    = null
    deliveryRef.current = null
    setSim(null)
  }, [cancelRaf])

  useEffect(() => () => cancelRaf(), [cancelRaf])

  return {
    sim,
    startSimulation,
    confirmPickup,
    confirmDelivery,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
  }
}
