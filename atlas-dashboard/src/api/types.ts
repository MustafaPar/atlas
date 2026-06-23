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
