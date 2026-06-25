import { useState } from 'react'
import { useMapData } from './useMapData'
import AtlasMap from './AtlasMap'
import type { AssignmentSummary, CourierResponse, OrderResponse } from '../api/types'

const VEHICLE_EMOJI: Record<string, string> = {
  BIKE: '🚲',
  MOTORCYCLE: '🏍',
  CAR: '🚗',
}

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  DELIVERING: 'Delivering',
  OFFLINE: 'Offline',
}

function OrderPanel({
  order,
  assignment,
  courier,
}: {
  order: OrderResponse
  assignment: AssignmentSummary | null
  courier: CourierResponse | null
}) {
  return (
    <div className="p-4 space-y-3">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order</p>
        <p className="text-xs font-mono text-gray-500">{order.id.slice(0, 8)}…</p>
        <div className="flex gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            order.status === 'WAITING' ? 'bg-yellow-100 text-yellow-700' :
            order.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
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
          <p className="text-xs text-gray-500">{STATUS_LABEL[courier.status]}</p>
        </div>
      )}
    </div>
  )
}

function CourierPanel({
  courier,
  assignment,
  order,
}: {
  courier: CourierResponse
  assignment: AssignmentSummary | null
  order: OrderResponse | null
}) {
  return (
    <div className="p-4 space-y-3">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Courier</p>
        <p className="text-sm font-semibold text-gray-800">
          {VEHICLE_EMOJI[courier.vehicleType]} {courier.name}
        </p>
        <p className="text-xs text-gray-500">{courier.phone}</p>
        <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
          courier.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
          courier.status === 'DELIVERING' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-500'
        }`}>{STATUS_LABEL[courier.status]}</span>
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
    </div>
  )
}

interface Props {
  onLogout: () => void
  onViewOrders: () => void
}

export default function MapPage({ onLogout, onViewOrders }: Props) {
  const { zones, couriers, orders, assignments, loading, error, reload } = useMapData()

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null)

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

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) ?? null
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

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo-mark.svg" alt="Atlas" className="h-8" />
          <span className="text-sm text-gray-400">Last-Mile Delivery</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onViewOrders}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Orders
          </button>
          <span className="text-sm font-medium text-gray-800">Map</span>
          <button
            onClick={reload}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={onLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

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
            <AtlasMap
              data={{ zones, couriers, orders, assignments }}
              selection={{ orderId: selectedOrderId, courierId: selectedCourierId }}
              onSelectOrder={handleSelectOrder}
              onSelectCourier={handleSelectCourier}
              onDeselect={handleDeselect}
            />
          )}
        </div>

        {hasPanel && (
          <div className="w-64 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
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
              />
            )}

            {selectedCourier && (
              <CourierPanel
                courier={selectedCourier}
                assignment={assignmentForCourier}
                order={orderForCourierAssignment}
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
          <span className="ml-auto">{zones.length} zones · {couriers.length} couriers · {orders.length} orders</span>
        </div>
      )}
    </div>
  )
}
