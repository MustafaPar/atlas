export interface ApiResponse<T> {
  data: T
  message: string | null
  success: boolean
}

export interface AuthResponse {
  accessToken: string
  email: string
  role: string
}

export type OrderStatus = 'WAITING' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED'
export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED'
export type SlaTier = 'STANDARD' | 'EXPRESS' | 'PRIORITY' | 'SAME_DAY'
export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
export type VehicleType = 'BIKE' | 'MOTORCYCLE' | 'CAR'

export interface OrderSummary {
  id: string
  status: OrderStatus
  priority: OrderPriority
  slaTier: SlaTier | null
  slaStatus: SlaStatus | null
  etaMinutes: number | null
  etaConfidence: number | null
  pickupAddress: string
  deliveryAddress: string
  pickupZoneId: string | null
  pickupZoneSlug: string | null
  pickupZoneName: string | null
  deliveryZoneId: string | null
  deliveryZoneSlug: string | null
  deliveryZoneName: string | null
  createdAt: string
  updatedAt: string
}

export interface AssignmentSummary {
  id: string
  orderId: string
  courierId: string
  courierName: string
  totalScore: number
  assignedAt: string
  pickedUpAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
}

export interface GeoPoint {
  lat: number
  lng: number
}

export type CourierStatus = 'AVAILABLE' | 'DELIVERING' | 'OFFLINE'

export interface ZoneResponse {
  id: string
  slug: string
  name: string
  description: string | null
  polygon: GeoPoint[]
  maxCapacity: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CourierResponse {
  id: string
  name: string
  phone: string
  vehicleType: VehicleType
  status: CourierStatus
  latitude: number | null
  longitude: number | null
  zoneId: string | null
  zoneSlug: string | null
  zoneName: string | null
  isActive: boolean
  withinZone: boolean | null
  createdAt: string
  updatedAt: string
}

export interface OrderResponse {
  id: string
  pickupLatitude: number
  pickupLongitude: number
  pickupAddress: string
  deliveryLatitude: number
  deliveryLongitude: number
  deliveryAddress: string
  priority: OrderPriority
  status: OrderStatus
  estimatedDurationMin: number | null
  slaTier: SlaTier | null
  promisedDeliveryAt: string | null
  deliveredAt: string | null
  slaStatus: SlaStatus | null
  etaMinutes: number | null
  etaComputedAt: string | null
  etaConfidence: number | null
  estimatedArrivalAt: string | null
  minutesToDeadline: number | null
  slaFeasible: boolean | null
  pickupZoneId: string | null
  pickupZoneSlug: string | null
  pickupZoneName: string | null
  deliveryZoneId: string | null
  deliveryZoneSlug: string | null
  deliveryZoneName: string | null
  createdAt: string
  updatedAt: string
}

export interface AssignmentResponse {
  id: string
  orderId: string
  courierId: string
  courierName: string
  courierVehicleType: VehicleType
  totalScore: number
  etaScore: number | null
  slaScore: number | null
  zoneScore: number | null
  distanceScore: number | null
  assignedAt: string
  pickedUpAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
}
