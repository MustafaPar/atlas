import { useEffect, useState, useCallback } from 'react'
import client from '../api/client'
import type { ApiResponse, OrderSummary, AssignmentSummary } from '../api/types'
import { clearToken } from '../auth/useAuth'
import OrderRow from './OrderRow'
import AppHeader from '../components/AppHeader'

const SLA_ORDER: Record<string, number> = { BREACHED: 0, AT_RISK: 1, ON_TRACK: 2 }
const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 }

interface Props {
  onLogout: () => void
  onViewMap: () => void
}

interface KpiCardProps {
  label: string
  value: string | number
  valueClass?: string
}

function KpiCard({ label, value, valueClass = 'text-gray-900' }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-3xl font-semibold mt-2 ${valueClass}`}>{value}</p>
    </div>
  )
}

export default function OrdersPage({ onLogout, onViewMap }: Props) {
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [resetting, setResetting] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [ordersRes, assignmentsRes] = await Promise.all([
        client.get<ApiResponse<OrderSummary[]>>('/api/v1/orders'),
        client.get<ApiResponse<AssignmentSummary[]>>('/api/v1/assignments?activeOnly=true'),
      ])
      setOrders(ordersRes.data.data)
      setAssignments(assignmentsRes.data.data)
      setLastUpdated(new Date())
    } catch {
      setError('Failed to load data. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleResetDemo = useCallback(async () => {
    setResetting(true)
    setError(null)
    try {
      await client.post('/api/v1/demo/reset')
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number; data?: { message?: string } } })?.response?.status
      const msg    = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(`Reset failed (HTTP ${status ?? 'no response'}${msg ? ': ' + msg : ''}). Restart the backend and try again.`)
      setResetting(false)
      return
    }
    // Reset succeeded — reload data independently so its errors are reported separately.
    try {
      await load()
    } catch {
      setError('Reset succeeded but data reload failed. Click Refresh.')
    } finally {
      setResetting(false)
    }
  }, [load])

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

  // KPI values
  const totalOrders = orders.filter(o => o.status !== 'CANCELLED').length
  const activeAssignments = new Set(assignments.map(a => a.courierId)).size
  const inProgress = orders.filter(o => o.status === 'ASSIGNED' || o.status === 'PICKED_UP').length
  const ordersWithSla = orders.filter(o => o.slaStatus != null)
  const onTrackCount = ordersWithSla.filter(o => o.slaStatus === 'ON_TRACK').length
  const breachedCount = orders.filter(o => o.slaStatus === 'BREACHED').length
  const slaCompliance = ordersWithSla.length > 0
    ? Math.round(onTrackCount / ordersWithSla.length * 100)
    : 100

  const slaValueClass = breachedCount > 0 ? 'text-red-600' : slaCompliance < 100 ? 'text-amber-600' : 'text-gray-900'

  // Sort: BREACHED first, then AT_RISK, then ON_TRACK; within group by priority
  const sorted = [...orders].sort((a, b) => {
    const slaA = SLA_ORDER[a.slaStatus ?? 'ON_TRACK'] ?? 2
    const slaB = SLA_ORDER[b.slaStatus ?? 'ON_TRACK'] ?? 2
    if (slaA !== slaB) return slaA - slaB
    const priA = PRIORITY_ORDER[a.priority] ?? 3
    const priB = PRIORITY_ORDER[b.priority] ?? 3
    return priA - priB
  })

  const inProgressCount = orders.filter(o => o.status === 'ASSIGNED' || o.status === 'PICKED_UP').length
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader
        activeView="orders"
        onViewOrders={() => {}}
        onViewMap={onViewMap}
        onLogout={handleLogout}
        lastUpdated={lastUpdated}
      />

      <main className="w-full px-8 py-8 flex-1">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Operations Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Live operational status of your delivery network.</p>
        </div>

        {/* KPI cards */}
        {!loading && !error && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <KpiCard label="Total Orders" value={totalOrders} />
            <KpiCard label="Active Assignments" value={activeAssignments} />
            <KpiCard label="Deliveries in Progress" value={inProgress} />
            <KpiCard
              label="SLA Compliance"
              value={ordersWithSla.length > 0 ? `${slaCompliance}%` : '—'}
              valueClass={slaValueClass}
            />
          </div>
        )}

        {/* Orders section */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Orders</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
              title="Restore demo data to initial state"
            >
              {resetting ? 'Resetting…' : '⟳ Reset demo'}
            </button>
            <button
              onClick={load}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              ↺ Refresh
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-sm text-gray-500 py-8 text-center">Loading…</p>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={load}
              className="text-xs text-red-600 hover:text-red-800 font-medium ml-4 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">SLA</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">ETA</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Priority</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Route</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                      No active orders — system nominal.
                    </td>
                  </tr>
                ) : (
                  sorted.map((order) => (
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

        {!loading && !error && (
          <p className="text-xs text-gray-400 mt-3">
            {totalOrders} orders · {inProgressCount} in transit · {deliveredCount} delivered
          </p>
        )}
      </main>
    </div>
  )
}
