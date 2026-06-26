import { useState, useCallback } from 'react'
import { useMapData } from './useMapData'
import { useSimulation } from './useSimulation'
import type { SimState, SimPhase } from './useSimulation'
import AtlasMap from './AtlasMap'
import SimulationControls from './SimulationControls'
import AppHeader from '../components/AppHeader'
import client from '../api/client'
import { fetchRoute } from './routing'
import type { AssignmentSummary, CourierResponse, OrderResponse } from '../api/types'

const VEHICLE_EMOJI: Record<string, string> = {
  BIKE: '🚲',
  MOTORCYCLE: '🏍',
  CAR: '🚗',
}

const COURIER_STATUS_LABEL: Record<string, string> = {
  AVAILABLE:  'Available',
  DELIVERING: 'Delivering',
  OFFLINE:    'Offline',
}

const SIM_PHASE_LABEL: Record<SimPhase, string> = {
  to_pickup:   'En route to pickup',
  at_pickup:   'At pickup',
  to_delivery: 'En route to delivery',
  at_delivery: 'At delivery',
  done:        'Delivered',
}

function formatEta(seconds: number): string {
  if (seconds <= 0) return 'Arriving…'
  if (seconds < 60) return `~${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `~${m}m ${s}s`
}

// ─── Order detail panel ────────────────────────────────────────────────────

function OrderPanel({
  order,
  assignment,
  courier,
  sim,
  apiLoading,
  onStartSim,
  onPauseSim,
  onResumeSim,
  onConfirmPickup,
  onConfirmDelivery,
  onStopSim,
}: {
  order: OrderResponse
  assignment: AssignmentSummary | null
  courier: CourierResponse | null
  sim: SimState | null
  apiLoading: boolean
  onStartSim: () => void
  onPauseSim: () => void
  onResumeSim: () => void
  onConfirmPickup: () => void
  onConfirmDelivery: () => void
  onStopSim: () => void
}) {
  return (
    <div className="p-4 space-y-3">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order</p>
        <p className="text-xs font-mono text-gray-500">{order.id.slice(0, 8)}…</p>
        <div className="flex gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            order.status === 'WAITING'   ? 'bg-yellow-100 text-yellow-700' :
            order.status === 'ASSIGNED'  ? 'bg-blue-100 text-blue-700' :
            order.status === 'PICKED_UP' ? 'bg-indigo-100 text-indigo-700' :
            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-500'
          }`}>{order.status.replace('_', ' ')}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{order.priority}</span>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Route</p>
        <p className="text-xs text-gray-700">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
          {order.pickupAddress}
        </p>
        <p className="text-xs text-gray-700 mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
          {order.deliveryAddress}
        </p>
      </div>

      {order.etaMinutes !== null && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">ETA</p>
          <p className="text-sm font-semibold text-gray-800">{order.etaMinutes} min</p>
        </div>
      )}

      {assignment && courier && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Assigned Courier</p>
          <p className="text-sm font-medium text-gray-800">
            {VEHICLE_EMOJI[courier.vehicleType]} {courier.name}
          </p>
          <p className="text-xs text-gray-500">{COURIER_STATUS_LABEL[courier.status] ?? courier.status}</p>
        </div>
      )}

      <SimulationControls
        order={order}
        assignment={assignment}
        courier={courier}
        sim={sim}
        onStart={onStartSim}
        onPause={onPauseSim}
        onResume={onResumeSim}
        onConfirmPickup={onConfirmPickup}
        onConfirmDelivery={onConfirmDelivery}
        onStop={onStopSim}
        apiLoading={apiLoading}
      />
    </div>
  )
}

// ─── Courier detail panel ──────────────────────────────────────────────────

function CourierPanel({
  courier,
  assignment,
  order,
  sim,
  apiLoading,
  onPauseSim,
  onResumeSim,
  onStopSim,
}: {
  courier: CourierResponse
  assignment: AssignmentSummary | null
  order: OrderResponse | null
  sim: SimState | null
  apiLoading: boolean
  onPauseSim: () => void
  onResumeSim: () => void
  onStopSim: () => void
}) {
  const isMoving = sim && (sim.phase === 'to_pickup' || sim.phase === 'to_delivery')

  return (
    <div className="p-4 space-y-3">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Courier</p>
        <p className="text-sm font-semibold text-gray-800">
          {VEHICLE_EMOJI[courier.vehicleType]} {courier.name}
        </p>
        <p className="text-xs text-gray-500">{courier.phone}</p>
        <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
          courier.status === 'AVAILABLE'  ? 'bg-green-100 text-green-700' :
          courier.status === 'DELIVERING' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-500'
        }`}>{COURIER_STATUS_LABEL[courier.status] ?? courier.status}</span>
      </div>

      {courier.zoneName && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Zone</p>
          <p className="text-xs text-gray-700">{courier.zoneName}</p>
        </div>
      )}

      {assignment && order && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Active Order</p>
          <p className="text-xs font-mono text-gray-500">{order.id.slice(0, 8)}…</p>
          <p className="text-xs text-gray-700 mt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            {order.pickupAddress}
          </p>
          <p className="text-xs text-gray-700 mt-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
            {order.deliveryAddress}
          </p>
        </div>
      )}

      {/* Live simulation info */}
      {sim && (
        <div className="pt-3 border-t border-gray-100 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`shrink-0 inline-block h-1.5 w-1.5 rounded-full ${
                isMoving && !sim.paused ? 'bg-indigo-500 animate-pulse' :
                sim.paused             ? 'bg-amber-400' :
                sim.phase === 'done'   ? 'bg-green-500' :
                                         'bg-amber-500'
              }`} />
              <p className="text-xs font-medium text-gray-700 truncate">
                {sim.paused ? 'Paused' : SIM_PHASE_LABEL[sim.phase]}
              </p>
            </div>
            {isMoving && !sim.paused && (
              <p className="shrink-0 text-xs text-gray-400 tabular-nums">
                {formatEta(sim.etaSeconds)}
              </p>
            )}
          </div>

          {isMoving && (
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-400 rounded-full"
                style={{ width: `${Math.round(sim.progress * 100)}%`, transition: 'none' }}
              />
            </div>
          )}

          {isMoving && !sim.paused && (
            <p className="text-xs text-gray-400">{sim.speedKmh.toFixed(0)} km/h</p>
          )}

          {isMoving && !apiLoading && (
            sim.paused ? (
              <button onClick={onResumeSim} className="w-full px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                Resume
              </button>
            ) : (
              <button onClick={onPauseSim} className="w-full px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                Pause
              </button>
            )
          )}

          {sim.phase !== 'done' && (
            <button onClick={onStopSim} className="w-full px-3 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Stop simulation
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main MapPage ──────────────────────────────────────────────────────────

interface Props {
  onLogout: () => void
  onViewOrders: () => void
}

export default function MapPage({ onLogout, onViewOrders }: Props) {
  const { zones, couriers, orders, assignments, loading, error, reload } = useMapData()
  const {
    simMap,
    activeCount,
    simulatingOrderIds,
    startSimulation,
    confirmPickup,
    confirmDelivery,
    pauseSimulation,
    resumeSimulation,
    stopSimulation,
  } = useSimulation()

  const [selectedOrderId, setSelectedOrderId]     = useState<string | null>(null)
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null)
  const [simApiLoading, setSimApiLoading]         = useState<Record<string, boolean>>({})
  const [lastUpdated, setLastUpdated]             = useState<Date | null>(null)

  function handleSelectOrder(id: string) {
    setSelectedOrderId(id)
    setSelectedCourierId(null)
  }

  function handleSelectCourier(id: string) {
    setSelectedCourierId(id)
    setSelectedOrderId(null)
  }

  function handleDeselect() {
    setSelectedOrderId(null)
    setSelectedCourierId(null)
  }

  function handleReload() {
    reload()
    setLastUpdated(new Date())
  }

  const selectedOrder   = orders.find((o) => o.id === selectedOrderId)    ?? null
  const selectedCourier = couriers.find((c) => c.id === selectedCourierId) ?? null

  const assignmentForOrder = selectedOrder
    ? assignments.find((a) => a.orderId === selectedOrder.id && a.deliveredAt === null && a.cancelledAt === null) ?? null
    : null

  const courierForOrderAssignment = assignmentForOrder
    ? couriers.find((c) => c.id === assignmentForOrder.courierId) ?? null
    : null

  const assignmentForCourier = selectedCourier
    ? assignments.find((a) => a.courierId === selectedCourier.id && a.deliveredAt === null && a.cancelledAt === null) ?? null
    : null

  const orderForCourierAssignment = assignmentForCourier
    ? orders.find((o) => o.id === assignmentForCourier.orderId) ?? null
    : null

  const hasPanel = selectedOrder !== null || selectedCourier !== null

  // ── Simulation helpers ──────────────────────────────────────────────────

  // When a courier has no GPS coords, offset the fallback start so the to_pickup
  // leg has a visible distance instead of sitting on the same point as pickup.
  function offsetFromPickup(pickupLat: number, pickupLng: number) {
    const angle = Math.random() * 2 * Math.PI
    const dist  = 0.004 + Math.random() * 0.003  // ~440–770m
    return { lat: pickupLat + Math.cos(angle) * dist, lng: pickupLng + Math.sin(angle) * dist }
  }

  // ── Simulation handlers ─────────────────────────────────────────────────

  const handleStartSim = useCallback(async () => {
    if (!selectedOrder || !assignmentForOrder || !courierForOrderAssignment) return
    const courierId = courierForOrderAssignment.id
    const hasGps = courierForOrderAssignment.latitude != null && courierForOrderAssignment.longitude != null
    const fallback = offsetFromPickup(selectedOrder.pickupLatitude, selectedOrder.pickupLongitude)
    const courierLat = hasGps ? courierForOrderAssignment.latitude! : fallback.lat
    const courierLng = hasGps ? courierForOrderAssignment.longitude! : fallback.lng
    setSimApiLoading((prev) => ({ ...prev, [courierId]: true }))
    const route = await fetchRoute(
      { lat: courierLat, lng: courierLng },
      { lat: selectedOrder.pickupLatitude, lng: selectedOrder.pickupLongitude },
    )
    startSimulation({
      orderId:      selectedOrder.id,
      courierId,
      assignmentId: assignmentForOrder.id,
      vehicleType:  courierForOrderAssignment.vehicleType,
      courierLat,
      courierLng,
      pickupLat:    selectedOrder.pickupLatitude,
      pickupLng:    selectedOrder.pickupLongitude,
      deliveryLat:  selectedOrder.deliveryLatitude,
      deliveryLng:  selectedOrder.deliveryLongitude,
      route,
    })
    setSimApiLoading((prev) => ({ ...prev, [courierId]: false }))
  }, [selectedOrder, assignmentForOrder, courierForOrderAssignment, startSimulation])

  // Start simulations for all ASSIGNED orders not already simulating.
  const handleSimulateAll = useCallback(async () => {
    // Collect eligible orders first so we can fetch all routes in parallel.
    const toStart: Array<{
      order: OrderResponse; asgn: AssignmentSummary; courier: CourierResponse
      courierLat: number; courierLng: number
    }> = []

    for (const order of orders) {
      if (order.status !== 'ASSIGNED') continue
      const asgn = assignments.find((a) => a.orderId === order.id && !a.deliveredAt && !a.cancelledAt)
      if (!asgn) continue
      const courier = couriers.find((c) => c.id === asgn.courierId)
      if (!courier || simMap[courier.id]) continue
      const hasGps = courier.latitude != null && courier.longitude != null
      const fallback = offsetFromPickup(order.pickupLatitude, order.pickupLongitude)
      toStart.push({
        order, asgn, courier,
        courierLat: hasGps ? courier.latitude! : fallback.lat,
        courierLng: hasGps ? courier.longitude! : fallback.lng,
      })
    }

    if (toStart.length === 0) return

    // Fetch all to-pickup routes in parallel (OSRM or fallback).
    const routes = await Promise.all(
      toStart.map(({ courierLat, courierLng, order }) =>
        fetchRoute(
          { lat: courierLat, lng: courierLng },
          { lat: order.pickupLatitude, lng: order.pickupLongitude },
        )
      )
    )

    for (let i = 0; i < toStart.length; i++) {
      const { order, asgn, courier, courierLat, courierLng } = toStart[i]
      startSimulation({
        orderId:      order.id,
        courierId:    courier.id,
        assignmentId: asgn.id,
        vehicleType:  courier.vehicleType,
        courierLat,
        courierLng,
        pickupLat:    order.pickupLatitude,
        pickupLng:    order.pickupLongitude,
        deliveryLat:  order.deliveryLatitude,
        deliveryLng:  order.deliveryLongitude,
        route:        routes[i],
      })
    }
  }, [orders, assignments, couriers, simMap, startSimulation])

  const handleConfirmPickup = useCallback(async (courierId: string) => {
    const entry = simMap[courierId]
    if (!entry) return
    setSimApiLoading((prev) => ({ ...prev, [courierId]: true }))
    try {
      // Fetch delivery route in parallel with the pickup API call — no extra wait.
      const [, delivRoute] = await Promise.all([
        client.patch(`/api/v1/assignments/${entry.assignmentId}/pickup`),
        fetchRoute(
          { lat: entry.lat,         lng: entry.lng },
          { lat: entry.deliveryLat, lng: entry.deliveryLng },
        ),
      ])
      confirmPickup(courierId, delivRoute)
      reload()
      setLastUpdated(new Date())
    } catch {
      // leave phase so operator can retry
    } finally {
      setSimApiLoading((prev) => ({ ...prev, [courierId]: false }))
    }
  }, [simMap, confirmPickup, reload])

  const handleConfirmDelivery = useCallback(async (courierId: string) => {
    const entry = simMap[courierId]
    if (!entry) return
    setSimApiLoading((prev) => ({ ...prev, [courierId]: true }))
    try {
      await client.patch(`/api/v1/assignments/${entry.assignmentId}/deliver`)
      confirmDelivery(courierId)
      reload()
      setLastUpdated(new Date())
    } catch {
      // leave phase so operator can retry
    } finally {
      setSimApiLoading((prev) => ({ ...prev, [courierId]: false }))
    }
  }, [simMap, confirmDelivery, reload])

  // ── Derived data for map rendering ──────────────────────────────────────

  // Merge simulated positions into couriers array.
  const renderedCouriers = couriers.map((c) => {
    const entry = simMap[c.id]
    return entry ? { ...c, latitude: entry.lat, longitude: entry.lng } : c
  })

  // Compute simulation readiness and a user-facing reason when disabled.
  const assignedOrders = orders.filter((o) => o.status === 'ASSIGNED')
  const simReadyOrders = assignedOrders.filter((o) => {
    const asgn = assignments.find((a) => a.orderId === o.id && !a.deliveredAt && !a.cancelledAt)
    if (!asgn) return false
    const courier = couriers.find((c) => c.id === asgn.courierId)
    return courier && !simMap[courier.id]
  })
  const canSimulateMore = simReadyOrders.length > 0
  const simDisabledReason: string | null = canSimulateMore ? null
    : activeCount > 0 && assignedOrders.length === 0 ? null  // all running, no label needed
    : assignedOrders.length === 0 ? 'No assigned orders on map'
    : simReadyOrders.length === 0 && activeCount > 0 ? null  // all already running
    : 'No couriers assigned to orders'

  // Sim entry for the currently selected order (via its assigned courier).
  const simForSelectedOrder = courierForOrderAssignment
    ? simMap[courierForOrderAssignment.id] ?? null
    : null

  // Sim entry for the currently selected courier.
  const simForSelectedCourier = selectedCourier
    ? simMap[selectedCourier.id] ?? null
    : null

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <AppHeader
        activeView="map"
        onViewOrders={onViewOrders}
        onViewMap={() => {}}
        onLogout={onLogout}
        lastUpdated={lastUpdated}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative" style={{ height: '100%' }}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <p className="text-sm text-gray-500">Loading map…</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              <AtlasMap
                data={{ zones, couriers: renderedCouriers, orders, assignments }}
                selection={{ orderId: selectedOrderId, courierId: selectedCourierId }}
                extraHighlightedOrderIds={simulatingOrderIds}
                simulatingCourierIds={new Set(Object.keys(simMap))}
                onSelectOrder={handleSelectOrder}
                onSelectCourier={handleSelectCourier}
                onDeselect={handleDeselect}
              />

              {/* Simulation toolbar — top-right, always visible after map loads */}
              <div className="absolute top-3 right-3 z-[1001] flex flex-col gap-1 items-end">
                <button
                  onClick={handleSimulateAll}
                  disabled={!canSimulateMore}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm border transition-colors backdrop-blur-sm ${
                    canSimulateMore
                      ? 'bg-indigo-600 border-indigo-700 text-white hover:bg-indigo-700 cursor-pointer'
                      : 'bg-white/95 border-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ▶ Simulate All Assigned
                </button>
                {simDisabledReason && (
                  <p className="text-[10px] text-white/80 bg-black/30 rounded px-2 py-0.5 backdrop-blur-sm">
                    {simDisabledReason}
                  </p>
                )}
                {activeCount > 0 && (
                  <button
                    onClick={() => stopSimulation()}
                    className="mt-0.5 px-3 py-1.5 text-xs font-medium bg-white/95 border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-red-600 hover:bg-white transition-colors backdrop-blur-sm"
                  >
                    ✕ Stop All ({activeCount})
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {hasPanel && (
          <div className="w-72 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {selectedOrder ? 'Order Detail' : 'Courier Detail'}
              </p>
              <button
                onClick={handleDeselect}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>

            {selectedOrder && (
              <OrderPanel
                order={selectedOrder}
                assignment={assignmentForOrder}
                courier={courierForOrderAssignment}
                sim={simForSelectedOrder}
                apiLoading={courierForOrderAssignment ? (simApiLoading[courierForOrderAssignment.id] ?? false) : false}
                onStartSim={handleStartSim}
                onPauseSim={() => courierForOrderAssignment && pauseSimulation(courierForOrderAssignment.id)}
                onResumeSim={() => courierForOrderAssignment && resumeSimulation(courierForOrderAssignment.id)}
                onConfirmPickup={() => courierForOrderAssignment && handleConfirmPickup(courierForOrderAssignment.id)}
                onConfirmDelivery={() => courierForOrderAssignment && handleConfirmDelivery(courierForOrderAssignment.id)}
                onStopSim={() => courierForOrderAssignment && stopSimulation(courierForOrderAssignment.id)}
              />
            )}

            {selectedCourier && (
              <CourierPanel
                courier={selectedCourier}
                assignment={assignmentForCourier}
                order={orderForCourierAssignment}
                sim={simForSelectedCourier}
                apiLoading={simApiLoading[selectedCourier.id] ?? false}
                onPauseSim={() => pauseSimulation(selectedCourier.id)}
                onResumeSim={() => resumeSimulation(selectedCourier.id)}
                onStopSim={() => stopSimulation(selectedCourier.id)}
              />
            )}
          </div>
        )}
      </div>

      {!loading && !error && (
        <div className="shrink-0 bg-white border-t border-gray-100 px-6 py-2 flex gap-6 text-xs text-gray-500">
          <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />Pickup</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />Delivery</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5" />Available courier</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />Delivering courier</span>
          <span><span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-1.5" />Offline courier</span>
          <span className="ml-auto">
            {activeCount > 0 && (
              <span className="mr-3 text-indigo-500 font-medium">{activeCount} simulating</span>
            )}
            {zones.length} zones · {couriers.length} couriers · {orders.length} orders
          </span>
        </div>
      )}
    </div>
  )
}
