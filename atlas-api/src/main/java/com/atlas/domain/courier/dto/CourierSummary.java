package com.atlas.domain.courier.dto;

import com.atlas.domain.courier.CourierStatus;
import com.atlas.domain.courier.VehicleType;

import java.time.Instant;
import java.util.UUID;

public record CourierSummary(
        UUID id,
        String name,
        String phone,
        VehicleType vehicleType,
        CourierStatus status,
        UUID zoneId,
        boolean isActive,
        Instant updatedAt
) {}
