import { CircleMarker, Tooltip } from 'react-leaflet'
import type { CourierResponse } from '../api/types'

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: '#22c55e',
  DELIVERING: '#3b82f6',
  OFFLINE: '#9ca3af',
}

const VEHICLE_EMOJI: Record<string, string> = {
  BIKE: '🚲',
  MOTORCYCLE: '🏍',
  CAR: '🚗',
}

const SIM_COLOR = '#6366f1'  // indigo — distinct from status colors

interface Props {
  couriers: CourierResponse[]
  selectedCourierId: string | null
  simulatingCourierIds?: Set<string>
  onSelect: (id: string) => void
}

export default function CourierLayer({ couriers, selectedCourierId, simulatingCourierIds, onSelect }: Props) {
  const visible = couriers.filter(
    (c) => c.isActive && c.latitude != null && c.longitude != null,
  )

  return (
    <>
      {visible.map((courier) => {
        const simulating = simulatingCourierIds?.has(courier.id) ?? false
        const color      = simulating ? SIM_COLOR : (STATUS_COLOR[courier.status] ?? '#9ca3af')
        const selected   = courier.id === selectedCourierId
        const radius     = simulating ? (selected ? 18 : 14) : (selected ? 14 : 10)
        return (
          <>
            {/* Halo ring for simulating couriers */}
            {simulating && (
              <CircleMarker
                key={`${courier.id}-halo`}
                center={[courier.latitude!, courier.longitude!]}
                radius={radius + 7}
                pathOptions={{
                  color: SIM_COLOR,
                  fillColor: SIM_COLOR,
                  fillOpacity: 0.12,
                  weight: 1.5,
                  opacity: 0.5,
                }}
                interactive={false}
              />
            )}
            <CircleMarker
              key={courier.id}
              center={[courier.latitude!, courier.longitude!]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: selected ? 0.95 : (simulating ? 0.9 : 0.75),
                weight: simulating ? 2.5 : (selected ? 3 : 1.5),
                opacity: 1,
              }}
              eventHandlers={{ click: () => onSelect(courier.id) }}
            >
              <Tooltip direction="top" offset={[0, -10]}>
                <span className="font-medium">{VEHICLE_EMOJI[courier.vehicleType]} {courier.name}</span>
                {simulating && <span className="ml-1 text-indigo-600 font-semibold">· LIVE</span>}
                <br />
                <span className="text-xs text-gray-500">{simulating ? 'Simulating' : courier.status}</span>
                {courier.zoneName && (
                  <>
                    <br />
                    <span className="text-xs text-gray-400">{courier.zoneName}</span>
                  </>
                )}
              </Tooltip>
            </CircleMarker>
          </>
        )
      })}
    </>
  )
}
