package com.atlas.domain.eta;

import com.atlas.common.exception.ResourceNotFoundException;
import com.atlas.domain.courier.Courier;
import com.atlas.domain.courier.CourierRepository;
import com.atlas.domain.eta.dto.EtaResponse;
import com.atlas.domain.order.Order;
import com.atlas.domain.order.OrderRepository;
import com.atlas.domain.zone.DeliveryZone;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EtaService {

    private final OrderRepository orderRepository;
    private final CourierRepository courierRepository;
    private final EtaSnapshotRepository snapshotRepository;

    // GET /orders/{id}/eta
    // Returns the last persisted ETA. If none exists yet, computes without a courier,
    // persists to order + snapshot, then returns the result.
    @Transactional
    public EtaResponse getOrCompute(UUID orderId) {
        Order order = findOrder(orderId);
        if (order.getEtaMinutes() == null) {
            EtaResult result = computeAndStore(order, null);
            persistSnapshot(order, null, result);
            return toResponse(order, null);
        }
        return toResponse(order, null);
    }

    // POST /orders/{id}/eta
    // Always triggers a fresh computation. Persists to order + snapshot.
    @Transactional
    public EtaResponse computeForOrder(UUID orderId, UUID courierId) {
        Order order = findOrder(orderId);
        Courier courier = courierId != null
                ? courierRepository.findById(courierId)
                        .orElseThrow(() -> ResourceNotFoundException.of("Courier", courierId))
                : null;
        EtaResult result = computeAndStore(order, courier);
        persistSnapshot(order, courier, result);
        return toResponse(order, courierId);
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    private EtaResult computeAndStore(Order order, Courier courier) {
        EtaInput input = buildInput(order, courier);
        EtaResult result = EtaCalculator.compute(input);
        order.setEtaMinutes(result.etaMinutes());
        order.setEtaComputedAt(result.computedAt());
        order.setEtaConfidence(result.confidenceScore());
        order.setEtaDistanceKm(result.distanceKm());
        orderRepository.save(order);
        return result;
    }

    private void persistSnapshot(Order order, Courier courier, EtaResult result) {
        DeliveryZone dz = order.getDeliveryZone();
        EtaSnapshot snap = new EtaSnapshot();
        snap.setOrder(order);
        snap.setCourierId(courier != null ? courier.getId() : null);
        snap.setEtaMinutes(result.etaMinutes());
        snap.setConfidence(result.confidenceScore());
        snap.setDistanceKm(result.distanceKm());
        snap.setVehicleType(courier != null ? courier.getVehicleType().name() : null);
        snap.setRouteFactor(dz != null ? dz.getRouteFactor() : EtaCalculator.DEFAULT_ROUTE_FACTOR);
        snap.setComputedAt(result.computedAt());
        snapshotRepository.save(snap);
    }

    private EtaInput buildInput(Order order, Courier courier) {
        DeliveryZone dz = order.getDeliveryZone();
        double routeFactor = dz != null ? dz.getRouteFactor() : EtaCalculator.DEFAULT_ROUTE_FACTOR;
        boolean hasZoneRouteFactor = dz != null;

        Double courierLat = null;
        Double courierLon = null;
        com.atlas.domain.courier.VehicleType vehicleType = null;
        if (courier != null) {
            courierLat = courier.getLatitude();
            courierLon = courier.getLongitude();
            vehicleType = courier.getVehicleType();
        }

        return new EtaInput(
                order.getPickupLatitude(), order.getPickupLongitude(),
                order.getDeliveryLatitude(), order.getDeliveryLongitude(),
                courierLat, courierLon,
                vehicleType,
                routeFactor,
                hasZoneRouteFactor,
                order.getPromisedDeliveryAt());
    }

    private EtaResponse toResponse(Order order, UUID courierId) {
        Instant estimatedArrivalAt = order.getEtaComputedAt()
                .plus(order.getEtaMinutes(), ChronoUnit.MINUTES);
        Integer minutesToDeadline = null;
        Boolean slaFeasible = null;
        if (order.getPromisedDeliveryAt() != null) {
            long secs = ChronoUnit.SECONDS.between(estimatedArrivalAt, order.getPromisedDeliveryAt());
            minutesToDeadline = (int) (secs / 60);
            slaFeasible = estimatedArrivalAt.isBefore(order.getPromisedDeliveryAt());
        }
        return new EtaResponse(
                order.getId(),
                courierId,
                order.getEtaMinutes(),
                order.getEtaDistanceKm(),
                order.getEtaConfidence(),
                estimatedArrivalAt,
                minutesToDeadline,
                slaFeasible,
                order.getEtaComputedAt());
    }

    private Order findOrder(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", id));
    }
}
