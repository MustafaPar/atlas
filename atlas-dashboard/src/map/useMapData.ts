import { useEffect, useState, useCallback } from 'react'
import client from '../api/client'
import type {
  ApiResponse,
  ZoneSummary,
  ZoneResponse,
  CourierResponse,
  OrderResponse,
  OrderSummary,
  AssignmentSummary,
} from '../api/types'

export interface MapData {
  zones: ZoneResponse[]
  couriers: CourierResponse[]
  orders: OrderResponse[]
  assignments: AssignmentSummary[]
}

export interface MapDataState extends MapData {
  loading: boolean
  error: string | null
  reload: () => void
}

export function useMapData(): MapDataState {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<MapData>({
    zones: [],
    couriers: [],
    orders: [],
    assignments: [],
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [zoneListRes, couriersRes, orderListRes, assignmentsRes] = await Promise.all([
        client.get<ApiResponse<ZoneSummary[]>>('/api/v1/zones'),
        client.get<ApiResponse<CourierResponse[]>>('/api/v1/couriers'),
        client.get<ApiResponse<OrderSummary[]>>('/api/v1/orders'),
        client.get<ApiResponse<AssignmentSummary[]>>('/api/v1/assignments?activeOnly=true'),
      ])

      // Dashboard demo shortcut: GET /api/v1/zones returns ZoneSummary (no polygon).
      // Fetch each zone's full detail in parallel to obtain the polygon coordinates.
      // Replace with a dedicated map-summary endpoint (e.g. GET /api/v1/zones/map)
      // if the dataset grows beyond a handful of zones.
      const fullZones = await Promise.all(
        zoneListRes.data.data.map((z) =>
          client
            .get<ApiResponse<ZoneResponse>>(`/api/v1/zones/${z.id}`)
            .then((r) => r.data.data),
        ),
      )

      const orderSummaries = orderListRes.data.data

      // Dashboard demo shortcut: fetch full order details in parallel to obtain
      // pickup/delivery coordinates, which are absent from OrderSummary.
      // Replace with a dedicated map-summary endpoint (e.g. GET /api/v1/orders/map)
      // if the dataset grows beyond a few dozen orders.
      const fullOrders = await Promise.all(
        orderSummaries.map((o) =>
          client
            .get<ApiResponse<OrderResponse>>(`/api/v1/orders/${o.id}`)
            .then((r) => r.data.data),
        ),
      )

      setData({
        zones: fullZones,
        couriers: couriersRes.data.data,
        orders: fullOrders,
        assignments: assignmentsRes.data.data,
      })
    } catch {
      setError('Failed to load map data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { ...data, loading, error, reload: load }
}
