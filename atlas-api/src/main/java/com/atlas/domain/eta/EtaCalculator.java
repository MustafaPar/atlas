package com.atlas.domain.eta;

import com.atlas.common.util.GeoUtils;
import com.atlas.domain.courier.VehicleType;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public final class EtaCalculator {

    public static final double DEFAULT_ROUTE_FACTOR = 1.2;

    private static final double SPEED_BIKE        = 12.0;
    private static final double SPEED_MOTORCYCLE  = 25.0;
    private static final double SPEED_CAR         = 20.0;
    private static final double SPEED_DEFAULT     = 15.0;

    private EtaCalculator() {}

    public static EtaResult compute(EtaInput input) {
        Instant now = Instant.now();

        double rawKm = rawDistance(input);
        double effectiveKm = rawKm * input.routeFactor();
        double speedKmh = speedFor(input.vehicleType());
        int etaMinutes = (int) Math.ceil(effectiveKm / speedKmh * 60.0);

        double confidence = confidence(input);
        Instant estimatedArrivalAt = now.plus(etaMinutes, ChronoUnit.MINUTES);

        Integer minutesToDeadline = null;
        Boolean slaFeasible = null;
        if (input.promisedDeliveryAt() != null) {
            long secs = ChronoUnit.SECONDS.between(estimatedArrivalAt, input.promisedDeliveryAt());
            minutesToDeadline = (int) (secs / 60);
            slaFeasible = estimatedArrivalAt.isBefore(input.promisedDeliveryAt());
        }

        return new EtaResult(etaMinutes, rawKm, confidence, now, estimatedArrivalAt,
                minutesToDeadline, slaFeasible);
    }

    private static double rawDistance(EtaInput input) {
        if (input.courierLat() != null && input.courierLon() != null) {
            return GeoUtils.haversineKm(input.courierLat(), input.courierLon(),
                                        input.pickupLat(),  input.pickupLon())
                 + GeoUtils.haversineKm(input.pickupLat(), input.pickupLon(),
                                        input.deliveryLat(), input.deliveryLon());
        }
        return GeoUtils.haversineKm(input.pickupLat(), input.pickupLon(),
                                    input.deliveryLat(), input.deliveryLon());
    }

    private static double speedFor(VehicleType type) {
        if (type == null) return SPEED_DEFAULT;
        return switch (type) {
            case BIKE       -> SPEED_BIKE;
            case MOTORCYCLE -> SPEED_MOTORCYCLE;
            case CAR        -> SPEED_CAR;
        };
    }

    // Confidence contributions:
    //   0.4 base
    //   0.3 courier location known
    //   0.1 vehicle type known
    //   0.2 zone-supplied route factor (not the default)
    private static double confidence(EtaInput input) {
        double score = 0.4;
        if (input.courierLat() != null && input.courierLon() != null) score += 0.3;
        if (input.vehicleType() != null)                               score += 0.1;
        if (input.hasZoneRouteFactor())                                score += 0.2;
        return Math.min(score, 1.0);
    }
}
