import type { AssignmentResponse } from '../api/types'

const VEHICLE_LABEL: Record<string, string> = {
  BIKE: 'Bike',
  MOTORCYCLE: 'Moto',
  CAR: 'Car',
}

interface ScoreBarProps {
  label: string
  value: number | null
  weight: string
}

function ScoreBar({ label, value, weight }: ScoreBarProps) {
  if (value === null) return null
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-gray-500 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-gray-700 shrink-0">{value.toFixed(3)}</span>
      <span className="w-8 text-right text-gray-400 shrink-0">{weight}</span>
    </div>
  )
}

interface Props {
  assignment: AssignmentResponse
}

export default function AssignmentCard({ assignment }: Props) {
  const totalPct = Math.round(assignment.totalScore * 100)
  const vehicle = VEHICLE_LABEL[assignment.courierVehicleType] ?? assignment.courierVehicleType

  return (
    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {assignment.courierName}
          <span className="ml-2 text-xs text-gray-500 font-normal">{vehicle}</span>
        </span>
        <span className="text-sm font-bold text-blue-700">{totalPct}%</span>
      </div>
      <div className="space-y-1.5">
        <ScoreBar label="ETA"      value={assignment.etaScore}      weight="35%" />
        <ScoreBar label="SLA"      value={assignment.slaScore}      weight="35%" />
        <ScoreBar label="Zone"     value={assignment.zoneScore}     weight="20%" />
        <ScoreBar label="Distance" value={assignment.distanceScore} weight="10%" />
      </div>
    </div>
  )
}
