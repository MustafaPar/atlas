package com.atlas.domain.assignment;

import com.atlas.common.util.GeoUtils;
import com.atlas.domain.courier.Courier;
import com.atlas.domain.eta.EtaCalculator;
import com.atlas.domain.eta.EtaInput;
import com.atlas.domain.eta.EtaResult;
import com.atlas.domain.order.Order;
import com.atlas.domain.sla.SlaTier;
import com.atlas.domain.zone.DeliveryZone;

import java.util.UUID;

public final class AssignmentScorer {

    // Weights — must sum to 1.0
    public static final double W_ETA      = 0.35;
    public static final double W_SLA      = 0.35;
    public static final double W_ZONE     = 0.20;
    public static final double W_DISTANCE = 0.10;

    private AssignmentScorer() {}

    public static CourierScore score(Order order, Courier courier) {
        double distanceKm    = courierToPickupKm(courier, order);
        EtaInput  etaInput   = buildEtaInput(order, courier);
        EtaResult etaResult  = EtaCalculator.compute(etaInput);

        double etaScore      = scoreEta(etaResult.etaMinutes());
        double slaScore      = scoreSla(etaResult, order.getSlaTier());
        double zoneScore     = scoreZone(courier, order);
        double distanceScore = scoreDistance(distanceKm);

        double total = W_ETA * etaScore + W_SLA * slaScore
                     + W_ZONE * zoneScore + W_DISTANCE * distanceScore;

        return new CourierScore(courier, etaResult, etaScore, slaScore, zoneScore, distanceScore, total);
    }

    // ── Component scorers ────────────────────────────────────────────────────

    // 1/(1 + etaMin/30) — best near 0 minutes, decays toward 0 as ETA grows.
    static double scoreEta(int etaMinutes) {
        return 1.0 / (1.0 + etaMinutes / 30.0);
    }

    // 1.0 = feasible with buffer ≥ warning threshold
    // 0.5 = feasible but tight (within warning window)
    // 0.0 = ETA will breach SLA deadline
    // 0.75 = no SLA on order (neutral)
    static double scoreSla(EtaResult result, SlaTier tier) {
        if (tier == null || result.minutesToDeadline() == null) return 0.75;
        if (!Boolean.TRUE.equals(result.slaFeasible()))         return 0.0;
        return result.minutesToDeadline() >= tier.getWarningThresholdMinutes() ? 1.0 : 0.5;
    }

    // 1.0 = courier zone matches order delivery zone
    // 0.75 = courier zone matches order pickup zone only
    // 0.25 = courier has a zone but neither matches
    // 0.5  = courier has no zone (neutral)
    static double scoreZone(Courier courier, Order order) {
        if (courier.getZone() == null) return 0.5;
        UUID courierZoneId  = courier.getZone().getId();
        UUID deliveryZoneId = order.getDeliveryZone() != null ? order.getDeliveryZone().getId() : null;
        UUID pickupZoneId   = order.getPickupZone()   != null ? order.getPickupZone().getId()   : null;
        if (courierZoneId.equals(deliveryZoneId)) return 1.0;
        if (courierZoneId.equals(pickupZoneId))   return 0.75;
        return 0.25;
    }

    // 1/(1 + km) — exponential decay; 0 km = 1.0, 1 km = 0.5, 5 km = 0.17.
    static double scoreDistance(double km) {
        return 1.0 / (1.0 + km);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private static double courierToPickupKm(Courier courier, Order order) {
        if (courier.getLatitude() == null || courier.getLongitude() == null) {
            return 10.0; // soft penalty for unknown location
        }
        return GeoUtils.haversineKm(
                courier.getLatitude(),  courier.getLongitude(),
                order.getPickupLatitude(), order.getPickupLongitude());
    }

    private static EtaInput buildEtaInput(Order order, Courier courier) {
        DeliveryZone dz = order.getDeliveryZone();
        return new EtaInput(
                order.getPickupLatitude(),    order.getPickupLongitude(),
                order.getDeliveryLatitude(),  order.getDeliveryLongitude(),
                courier.getLatitude(),        courier.getLongitude(),
                courier.getVehicleType(),
                dz != null ? dz.getRouteFactor() : EtaCalculator.DEFAULT_ROUTE_FACTOR,
                dz != null,
                order.getPromisedDeliveryAt());
    }
}
