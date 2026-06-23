package com.atlas.domain.eta;

import com.atlas.domain.courier.VehicleType;

import java.time.Instant;

public record EtaInput(
        double pickupLat,
        double pickupLon,
        double deliveryLat,
        double deliveryLon,
        Double courierLat,
        Double courierLon,
        VehicleType vehicleType,
        double routeFactor,
        boolean hasZoneRouteFactor,
        Instant promisedDeliveryAt
) {}
