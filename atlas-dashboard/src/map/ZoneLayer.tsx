import { Polygon, Tooltip } from 'react-leaflet'
import type { ZoneResponse } from '../api/types'

const ZONE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
]

interface Props {
  zones: ZoneResponse[]
}

export default function ZoneLayer({ zones }: Props) {
  return (
    <>
      {zones.map((zone, i) => {
        const color = ZONE_COLORS[i % ZONE_COLORS.length]
        const positions = zone.polygon.map((p) => [p.lat, p.lng] as [number, number])
        return (
          <Polygon
            key={zone.id}
            positions={positions}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.12,
              weight: 2,
              opacity: 0.6,
            }}
          >
            <Tooltip sticky>{zone.name}</Tooltip>
          </Polygon>
        )
      })}
    </>
  )
}
