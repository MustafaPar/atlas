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

interface Props {
  couriers: CourierResponse[]
  selectedCourierId: string | null
  onSelect: (id: string) => void
}

export default function CourierLayer({ couriers, selectedCourierId, onSelect }: Props) {
  const visible = couriers.filter(
    (c) => c.isActive && c.latitude != null && c.longitude != null,
  )

  return (
    <>
      {visible.map((courier) => {
        const color = STATUS_COLOR[courier.status] ?? '#9ca3af'
        const selected = courier.id === selectedCourierId
        return (
          <CircleMarker
            key={courier.id}
            center={[courier.latitude!, courier.longitude!]}
            radius={selected ? 14 : 10}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: selected ? 0.95 : 0.75,
              weight: selected ? 3 : 1.5,
              opacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(courier.id) }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <span className="font-medium">{VEHICLE_EMOJI[courier.vehicleType]} {courier.name}</span>
              <br />
              <span className="text-xs text-gray-500">{courier.status}</span>
              {courier.zoneName && (
                <>
                  <br />
                  <span className="text-xs text-gray-400">{courier.zoneName}</span>
                </>
              )}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </>
  )
}
