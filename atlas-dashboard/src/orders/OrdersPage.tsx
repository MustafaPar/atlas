import { useEffect, useState, useCallback } from 'react'
import client from '../api/client'
import type { ApiResponse, OrderSummary, AssignmentSummary } from '../api/types'
import { clearToken } from '../auth/useAuth'
import OrderRow from './OrderRow'

interface Props {
  onLogout: () => void
  onViewMap: () => void
}

export default function OrdersPage({ onLogout, onViewMap }: Props) {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [ordersRes, assignmentsRes] = await Promise.all([
        client.get<ApiResponse<OrderSummary[]>>('/api/v1/orders'),
        client.get<ApiResponse<AssignmentSummary[]>>('/api/v1/assignments?activeOnly=true'),
      ])
      setOrders(ordersRes.data.data)
      setAssignments(assignmentsRes.data.data)
    } catch {
      setError('Failed to load data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleLogout() {
    clearToken()
    onLogout()
  }

  const assignmentByOrderId: Record<string, AssignmentSummary> = {}
  for (const a of assignments) {
    assignmentByOrderId[a.orderId] = a
  }

  const waitingCount   = orders.filter(o => o.status === 'WAITING').length
  const assignedCount  = orders.filter(o => o.status === 'ASSIGNED' || o.status === 'PICKED_UP').length
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-mark.svg" alt="Atlas" className="h-8" />
          <span className="text-sm text-gray-400">Last-Mile Delivery</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-800">Orders</span>
          <button
            onClick={onViewMap}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Map
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-semibold text-gray-800">Orders</h2>
            {!loading && !error && (
              <div className="flex gap-3 text-xs text-gray-500">
                <span><span className="font-medium text-gray-700">{waitingCount}</span> waiting</span>
                <span><span className="font-medium text-gray-700">{assignedCount}</span> in progress</span>
                <span><span className="font-medium text-gray-700">{deliveredCount}</span> delivered</span>
              </div>
            )}
          </div>
          <button
            onClick={load}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">SLA</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">ETA</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Route</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      activeAssignment={assignmentByOrderId[order.id] ?? null}
                      onRefresh={load}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
