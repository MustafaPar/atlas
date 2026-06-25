import { Fragment, useState } from 'react'
import type { OrderSummary, AssignmentSummary, AssignmentResponse, ApiResponse } from '../api/types'
import client from '../api/client'
import AssignmentCard from './AssignmentCard'

const STATUS_CLASS: Record<string, string> = {
  WAITING:   'text-gray-500',
  ASSIGNED:  'text-blue-600',
  PICKED_UP: 'text-indigo-600',
  DELIVERED: 'text-green-600',
  CANCELLED: 'text-red-400',
}

const STATUS_LABEL: Record<string, string> = {
  WAITING:   'Waiting',
  ASSIGNED:  'Assigned',
  PICKED_UP: 'Picked up',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

const SLA_CLASS: Record<string, string> = {
  ON_TRACK: 'text-gray-400',
  AT_RISK:  'text-amber-600',
  BREACHED: 'text-red-600 font-semibold',
}

const SLA_LABEL: Record<string, string> = {
  ON_TRACK: 'On track',
  AT_RISK:  'At risk',
  BREACHED: 'Breached',
}

const PRIORITY_CLASS: Record<string, string> = {
  LOW:    'text-gray-400',
  NORMAL: 'text-gray-500',
  HIGH:   'text-orange-600',
  URGENT: 'text-red-600 font-semibold',
}

const PRIORITY_LABEL: Record<string, string> = {
  LOW:    'Low',
  NORMAL: 'Normal',
  HIGH:   'High',
  URGENT: 'Urgent',
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
  const isBreached = order.slaStatus === 'BREACHED'

  return (
    <Fragment>
      <tr className={`border-b border-gray-100 hover:bg-gray-50/60 align-top transition-colors ${isBreached ? 'bg-red-50/10' : ''}`}>
        <td className="px-4 py-3.5">
          <span className={`text-xs ${STATUS_CLASS[order.status] ?? 'text-gray-500'}`}>
            {STATUS_LABEL[order.status] ?? order.status}
          </span>
        </td>
        <td className="px-4 py-3.5">
          {order.slaStatus ? (
            <span className={`text-xs ${SLA_CLASS[order.slaStatus] ?? 'text-gray-400'}`}>
              {SLA_LABEL[order.slaStatus] ?? order.slaStatus}
            </span>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
          {order.etaMinutes != null ? `${order.etaMinutes} min` : '—'}
        </td>
        <td className={`px-4 py-3.5 text-xs whitespace-nowrap ${PRIORITY_CLASS[order.priority] ?? ''}`}>
          {PRIORITY_LABEL[order.priority] ?? order.priority}
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-600 max-w-xs">
          <div className="truncate">{order.pickupAddress}</div>
          <div className="truncate text-gray-400 mt-0.5">{order.deliveryAddress}</div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex flex-col items-start gap-1">
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
                  className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                >
                  unassign
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
            {order.status === 'DELIVERED' && (
              <span className="text-xs text-gray-400">Completed</span>
            )}
            {order.status === 'CANCELLED' && (
              <span className="text-xs text-gray-300">Cancelled</span>
            )}
            {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
          </div>
        </td>
      </tr>
      {showCard && (
        <tr className="border-b border-gray-100 bg-blue-50/20">
          <td colSpan={6} className="px-4 pb-3 pt-0">
            <AssignmentCard assignment={freshAssignment!} />
          </td>
        </tr>
      )}
    </Fragment>
  )
}
