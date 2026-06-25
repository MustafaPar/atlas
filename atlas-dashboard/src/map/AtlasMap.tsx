import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import type { MapData } from './useMapData'
import ZoneLayer from './ZoneLayer'
import CourierLayer from './CourierLayer'
import OrderLayer from './OrderLayer'

interface SelectionState {
  orderId: string | null
  courierId: string | null
}

interface Props {
  data: MapData
  selection: SelectionState
  extraHighlightedOrderIds?: Set<string>
  simulatingCourierIds?: Set<string>
  onSelectOrder: (id: string) => void
  onSelectCourier: (id: string) => void
  onDeselect: () => void
}

function DeselectOnClick({ onDeselect }: { onDeselect: () => void }) {
  useMapEvents({ click: onDeselect })
  return null
}

function deriveHighlightedOrderIds(
  selection: SelectionState,
  assignments: MapData['assignments'],
): Set<string> {
  if (selection.orderId) return new Set([selection.orderId])
  if (selection.courierId) {
    const active = assignments.find(
      (a) => a.courierId === selection.courierId && a.deliveredAt === null && a.cancelledAt === null,
    )
    if (active) return new Set([active.orderId])
  }
  return new Set()
}

export default function AtlasMap({ data, selection, extraHighlightedOrderIds, simulatingCourierIds, onSelectOrder, onSelectCourier, onDeselect }: Props) {
  const derived = deriveHighlightedOrderIds(selection, data.assignments)
  const highlightedOrderIds = extraHighlightedOrderIds && extraHighlightedOrderIds.size > 0
    ? new Set([...derived, ...extraHighlightedOrderIds])
    : derived

  // Default center: centroid of first zone polygon, or London as fallback
  let center: [number, number] = [51.505, -0.09]
  if (data.zones.length > 0 && data.zones[0].polygon.length > 0) {
    const pts = data.zones[0].polygon
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length
    const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length
    center = [lat, lng]
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      className="h-full w-full"
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <DeselectOnClick onDeselect={onDeselect} />

      <ZoneLayer zones={data.zones} />

      <OrderLayer
        orders={data.orders}
        selectedOrderId={selection.orderId}
        highlightedOrderIds={highlightedOrderIds}
        onSelect={onSelectOrder}
      />

      <CourierLayer
        couriers={data.couriers}
        selectedCourierId={selection.courierId}
        simulatingCourierIds={simulatingCourierIds}
        onSelect={onSelectCourier}
      />
    </MapContainer>
  )
}
