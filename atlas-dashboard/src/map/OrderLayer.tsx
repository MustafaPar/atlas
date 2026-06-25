import { Fragment } from 'react'
import { CircleMarker, Polyline, Tooltip } from 'react-leaflet'
import type { OrderResponse } from '../api/types'

interface Props {
  orders: OrderResponse[]
  selectedOrderId: string | null
  highlightedOrderIds: Set<string>
  onSelect: (id: string) => void
}

export default function OrderLayer({
  orders,
  selectedOrderId,
  highlightedOrderIds,
  onSelect,
}: Props) {
  return (
    <>
      {orders.filter(o =>
        o.pickupLatitude != null && o.pickupLongitude != null &&
        o.deliveryLatitude != null && o.deliveryLongitude != null
      ).map((order) => {
        const pickup: [number, number] = [order.pickupLatitude, order.pickupLongitude]
        const delivery: [number, number] = [order.deliveryLatitude, order.deliveryLongitude]
        const selected = order.id === selectedOrderId
        const highlighted = highlightedOrderIds.has(order.id)
        const dimmed = (selectedOrderId !== null || highlightedOrderIds.size > 0) && !selected && !highlighted

        const pickupColor = '#22c55e'
        const deliveryColor = '#ef4444'
        const lineColor = selected || highlighted ? '#6366f1' : '#a5b4fc'
        const opacity = dimmed ? 0.2 : 1

        return (
          <Fragment key={order.id}>
            {(selected || highlighted) && (
              <Polyline
                positions={[pickup, delivery]}
                pathOptions={{
                  color: lineColor,
                  weight: 2,
                  opacity: 0.8,
                  dashArray: '6 4',
                }}
              />
            )}

            <CircleMarker
              center={pickup}
              radius={selected ? 8 : 6}
              pathOptions={{
                color: pickupColor,
                fillColor: '#fff',
                fillOpacity: opacity,
                weight: 2,
                opacity,
              }}
              eventHandlers={{ click: () => onSelect(order.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span className="text-xs font-medium">Pickup</span>
                <br />
                <span className="text-xs text-gray-500">{order.pickupAddress}</span>
                {order.pickupZoneName && (
                  <>
                    <br />
                    <span className="text-xs text-gray-400">{order.pickupZoneName}</span>
                  </>
                )}
              </Tooltip>
            </CircleMarker>

            <CircleMarker
              center={delivery}
              radius={selected ? 8 : 6}
              pathOptions={{
                color: deliveryColor,
                fillColor: '#fff',
                fillOpacity: opacity,
                weight: 2,
                opacity,
              }}
              eventHandlers={{ click: () => onSelect(order.id) }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span className="text-xs font-medium">Delivery</span>
                <br />
                <span className="text-xs text-gray-500">{order.deliveryAddress}</span>
                {order.deliveryZoneName && (
                  <>
                    <br />
                    <span className="text-xs text-gray-400">{order.deliveryZoneName}</span>
                  </>
                )}
              </Tooltip>
            </CircleMarker>
          </Fragment>
        )
      })}
    </>
  )
}
