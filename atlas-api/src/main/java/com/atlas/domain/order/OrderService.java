package com.atlas.domain.order;

import com.atlas.common.exception.BusinessRuleException;
import com.atlas.common.exception.ResourceNotFoundException;
import com.atlas.common.util.GeoUtils;
import com.atlas.common.util.PolygonUtils;
import com.atlas.domain.order.dto.CreateOrderRequest;
import com.atlas.domain.order.dto.OrderResponse;
import com.atlas.domain.order.dto.OrderSummary;
import com.atlas.domain.order.dto.UpdateOrderStatusRequest;
import com.atlas.domain.zone.DeliveryZone;
import com.atlas.domain.zone.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    // Average urban delivery speed used for estimated_duration_min calculation.
    private static final double AVG_SPEED_KMH = 15.0;

    private final OrderRepository orderRepository;
    private final ZoneRepository zoneRepository;

    @Transactional
    public OrderResponse create(CreateOrderRequest request) {
        List<DeliveryZone> activeZones = zoneRepository.findAllByActiveTrue();

        Order order = new Order();
        order.setPickupLatitude(request.pickupLatitude());
        order.setPickupLongitude(request.pickupLongitude());
        order.setPickupAddress(request.pickupAddress());
        order.setDeliveryLatitude(request.deliveryLatitude());
        order.setDeliveryLongitude(request.deliveryLongitude());
        order.setDeliveryAddress(request.deliveryAddress());
        order.setPriority(request.priority() != null ? request.priority() : OrderPriority.NORMAL);
        order.setStatus(OrderStatus.WAITING);

        order.setPickupZone(resolveZone(activeZones, request.pickupLatitude(), request.pickupLongitude()));
        order.setDeliveryZone(resolveZone(activeZones, request.deliveryLatitude(), request.deliveryLongitude()));

        order.setEstimatedDurationMin(estimateDurationMin(
                request.pickupLatitude(), request.pickupLongitude(),
                request.deliveryLatitude(), request.deliveryLongitude()));

        return toResponse(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderSummary> list(OrderStatus status, OrderPriority priority,
                                   UUID pickupZoneId, UUID deliveryZoneId) {
        return orderRepository
                .findAllWithFilters(status, priority, pickupZoneId, deliveryZoneId)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public OrderResponse updateStatus(UUID id, UpdateOrderStatusRequest request) {
        Order order = findOrThrow(id);
        validateTransition(order.getStatus(), request.status());
        order.setStatus(request.status());
        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public void cancel(UUID id) {
        Order order = findOrThrow(id);
        validateTransition(order.getStatus(), OrderStatus.CANCELLED);
        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void validateTransition(OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.DELIVERED || current == OrderStatus.CANCELLED) {
            throw new BusinessRuleException(
                    "Order is already in a terminal state: " + current);
        }
        // Only WAITING → CANCELLED is permitted through the public API.
        // ASSIGNED, PICKED_UP, and DELIVERED are set exclusively by the assignment engine.
        if (next != OrderStatus.CANCELLED) {
            throw new BusinessRuleException(
                    "Status " + next + " can only be set by the assignment engine");
        }
        if (current != OrderStatus.WAITING) {
            throw new BusinessRuleException(
                    "Only WAITING orders can be cancelled. Current status: " + current);
        }
    }

    private DeliveryZone resolveZone(List<DeliveryZone> zones, double lat, double lng) {
        return zones.stream()
                .filter(z -> PolygonUtils.contains(z.getPolygon(), lat, lng))
                .findFirst()
                .orElse(null);
    }

    private int estimateDurationMin(double lat1, double lon1, double lat2, double lon2) {
        double distanceKm = GeoUtils.haversineKm(lat1, lon1, lat2, lon2);
        return (int) Math.ceil(distanceKm / AVG_SPEED_KMH * 60.0);
    }

    private Order findOrThrow(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", id));
    }

    private OrderSummary toSummary(Order order) {
        DeliveryZone pz = order.getPickupZone();
        DeliveryZone dz = order.getDeliveryZone();
        return new OrderSummary(
                order.getId(),
                order.getStatus(),
                order.getPriority(),
                order.getPickupAddress(),
                order.getDeliveryAddress(),
                pz != null ? pz.getId()   : null,
                pz != null ? pz.getSlug() : null,
                pz != null ? pz.getName() : null,
                dz != null ? dz.getId()   : null,
                dz != null ? dz.getSlug() : null,
                dz != null ? dz.getName() : null,
                order.getCreatedAt(),
                order.getUpdatedAt());
    }

    private OrderResponse toResponse(Order order) {
        DeliveryZone pz = order.getPickupZone();
        DeliveryZone dz = order.getDeliveryZone();
        return new OrderResponse(
                order.getId(),
                order.getPickupLatitude(),
                order.getPickupLongitude(),
                order.getPickupAddress(),
                order.getDeliveryLatitude(),
                order.getDeliveryLongitude(),
                order.getDeliveryAddress(),
                order.getPriority(),
                order.getStatus(),
                order.getEstimatedDurationMin(),
                pz != null ? pz.getId()   : null,
                pz != null ? pz.getSlug() : null,
                pz != null ? pz.getName() : null,
                dz != null ? dz.getId()   : null,
                dz != null ? dz.getSlug() : null,
                dz != null ? dz.getName() : null,
                order.getCreatedAt(),
                order.getUpdatedAt());
    }
}
