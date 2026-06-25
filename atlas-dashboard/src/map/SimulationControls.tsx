import type { SimState, SimPhase } from './useSimulation'
import type { AssignmentSummary, CourierResponse, OrderResponse } from '../api/types'

interface Props {
  order: OrderResponse
  assignment: AssignmentSummary | null
  courier: CourierResponse | null
  sim: SimState | null
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onConfirmPickup: () => void
  onConfirmDelivery: () => void
  onStop: () => void
  apiLoading: boolean
}

const PHASE_LABEL: Record<SimPhase, string> = {
  to_pickup:   'En route to pickup',
  at_pickup:   'Arrived at pickup',
  to_delivery: 'En route to delivery',
  at_delivery: 'Arrived at delivery',
  done:        'Delivered',
}

function isMoving(phase: SimPhase) {
  return phase === 'to_pickup' || phase === 'to_delivery'
}

function formatEta(seconds: number): string {
  if (seconds <= 0) return 'Arriving…'
  if (seconds < 60) return `~${Math.round(seconds)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `~${m}m ${s}s`
}

export default function SimulationControls({
  order,
  assignment,
  courier,
  sim,
  onStart,
  onPause,
  onResume,
  onConfirmPickup,
  onConfirmDelivery,
  onStop,
  apiLoading,
}: Props) {
  if (order.status !== 'ASSIGNED' || !assignment || !courier) return null

  if (!sim) {
    return (
      <div className="pt-3 border-t border-gray-100">
        <button
          onClick={onStart}
          className="w-full px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Start Simulation
        </button>
      </div>
    )
  }

  const { phase, progress, paused, speedKmh, etaSeconds } = sim
  const moving = isMoving(phase)

  const dotClass =
    moving && !paused  ? 'bg-indigo-500 animate-pulse' :
    paused             ? 'bg-amber-400' :
    phase === 'done'   ? 'bg-green-500' :
                         'bg-amber-500'

  return (
    <div className="pt-3 border-t border-gray-100 space-y-2">
      {/* Phase + ETA */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`shrink-0 inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
          <p className="text-xs font-medium text-gray-700 truncate">
            {paused ? 'Paused' : PHASE_LABEL[phase]}
          </p>
        </div>
        {moving && (
          <p className="shrink-0 text-xs text-gray-400 tabular-nums">
            {formatEta(etaSeconds)}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {moving && (
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-400 rounded-full"
            style={{ width: `${Math.round(progress * 100)}%`, transition: 'none' }}
          />
        </div>
      )}

      {/* Speed */}
      {moving && !paused && (
        <p className="text-xs text-gray-400">{speedKmh.toFixed(0)} km/h</p>
      )}

      {/* Pause / Resume */}
      {moving && (
        paused ? (
          <button
            onClick={onResume}
            className="w-full px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Resume
          </button>
        ) : (
          <button
            onClick={onPause}
            className="w-full px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Pause
          </button>
        )
      )}

      {/* Confirm actions at waypoints */}
      {phase === 'at_pickup' && (
        <button
          onClick={onConfirmPickup}
          disabled={apiLoading}
          className="w-full px-3 py-1.5 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {apiLoading ? '…' : 'Confirm Pickup'}
        </button>
      )}

      {phase === 'at_delivery' && (
        <button
          onClick={onConfirmDelivery}
          disabled={apiLoading}
          className="w-full px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {apiLoading ? '…' : 'Confirm Delivery'}
        </button>
      )}

      {phase !== 'done' && (
        <button
          onClick={onStop}
          className="w-full px-3 py-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Stop simulation
        </button>
      )}
    </div>
  )
}
