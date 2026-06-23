import { Fragment, useState } from 'react'
import type { OrderSummary, AssignmentSummary, AssignmentResponse, ApiResponse } from '../api/types'
import client from '../api/client'
import AssignmentCard from './AssignmentCard'

const STATUS_STYLE: Record<string, string> = {
  WAITING:   'bg-gray-100 text-gray-700',
  ASSIGNED:  'bg-amber-100 text-amber-700',
  PICKED_UP: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

const SLA_STYLE: Record<string, string> = {
  ON_TRACK: 'bg-green-100 text-green-700',
  AT_RISK:  'bg-amber-100 text-amber-700',
  BREACHED: 'bg-red-100 text-red-700',
}

const PRIORITY_STYLE: Record<string, string> = {
  LOW:    'text-gray-400',
  NORMAL: 'text-gray-600',
  HIGH:   'text-orange-600',
  URGENT: 'text-red-600 font-semibold',
}

type ApiError = { response?: { data?: { message?: string } } }

function extractMessage(e: unknown): string {
  return (e as ApiError)?.response?.data?.message ?? 'Something went wrong.'
}

interface Props {
  order: OrderSummary
  activeAssignment: AssignmentSummary | null
  onRefresh: () => void
}

export default function OrderRow({ order, activeAssignment, onRefresh }: Props) {
  const [freshAssignment, setFreshAssignment] = useState<AssignmentResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assignmentId = freshAssignment?.id ?? activeAssignment?.id ?? null

  async function handleAssign() {
    setLoading(true)
    setError(null)
    try {
      const res = await client.post<ApiResponse<AssignmentResponse>>(
        `/api/v1/orders/${order.id}/assign`,
      )
      setFreshAssignment(res.data.data)
      onRefresh()
    } catch (e) {
      setError(extractMessage(e))
    } finally {
      setLoading(false)
    }
  }

  async function handlePickup() {
    if (!assignmentId) return
    setLoading(true)
    setError(null)
    try {
      await client.patch(`/api/v1/assignments/${assignmentId}/pickup`)
      onRefresh()
    } catch (e) {
      setError(extractMessage(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleDeliver() {
    if (!assignmentId) return
    setLoading(true)
    setError(null)
    try {
      await client.patch(`/api/v1/assignments/${assignmentId}/deliver`)
      onRefresh()
    } catch (e) {
      setError(extractMessage(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleUnassign() {
    if (!assignmentId) return
    setLoading(true)
    setError(null)
    try {
      await client.delete(`/api/v1/assignments/${assignmentId}`)
      setFreshAssignment(null)
      onRefresh()
    } catch (e) {
      setError(extractMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const showCard = freshAssignment !== null && order.status === 'ASSIGNED'

  return (
    <Fragment>
      <tr className="border-b border-gray-100 hover:bg-gray-50 align-top">
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[order.status] ?? ''}`}
          >
            {order.status.replace('_', ' ')}
          </span>
        </td>
        <td className="px-4 py-3">
          {order.slaStatus ? (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SLA_STYLE[order.slaStatus] ?? ''}`}
            >
              {order.slaStatus.replace('_', ' ')}
            </span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
          {order.etaMinutes != null ? `${order.etaMinutes} min` : '—'}
        </td>
        <td className={`px-4 py-3 text-xs whitespace-nowrap ${PRIORITY_STYLE[order.priority] ?? ''}`}>
          {order.priority}
        </td>
        <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
          <div className="truncate">{order.pickupAddress}</div>
          <div className="truncate text-gray-400">{order.deliveryAddress}</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {order.status === 'WAITING' && (
              <button
                onClick={handleAssign}
                disabled={loading}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '…' : 'Assign'}
              </button>
            )}
            {order.status === 'ASSIGNED' && assignmentId && (
              <>
                <button
                  onClick={handlePickup}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? '…' : 'Pickup'}
                </button>
                <button
                  onClick={handleUnassign}
                  disabled={loading}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                  Unassign
                </button>
              </>
            )}
            {order.status === 'PICKED_UP' && assignmentId && (
              <button
                onClick={handleDeliver}
                disabled={loading}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? '…' : 'Deliver'}
              </button>
            )}
            {error && <p className="text-xs text-red-600 w-full mt-1">{error}</p>}
          </div>
        </td>
      </tr>
      {showCard && (
        <tr className="border-b border-gray-100 bg-blue-50/30">
          <td colSpan={6} className="px-4 pb-3 pt-0">
            <AssignmentCard assignment={freshAssignment!} />
          </td>
        </tr>
      )}
    </Fragment>
  )
}
