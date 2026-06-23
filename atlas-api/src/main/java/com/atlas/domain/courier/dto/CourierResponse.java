package com.atlas.domain.courier.dto;

import com.atlas.domain.courier.CourierStatus;
import com.atlas.domain.courier.VehicleType;

import java.time.Instant;
import java.util.UUID;

public record CourierResponse(
        UUID id,
        String name,
        String phone,
        VehicleType vehicleType,
        CourierStatus status,
        Double latitude,
        Double longitude,
        UUID zoneId,
        String zoneSlug,
        String zoneName,
        boolean isActive,
        Boolean withinZone,
        Instant createdAt,
        Instant updatedAt
) {}
