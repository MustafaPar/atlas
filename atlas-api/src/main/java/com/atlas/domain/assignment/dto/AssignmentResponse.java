package com.atlas.domain.assignment.dto;

import com.atlas.domain.courier.VehicleType;

import java.time.Instant;
import java.util.UUID;

public record AssignmentResponse(
        UUID id,
        UUID orderId,
        UUID courierId,
        String courierName,
        VehicleType courierVehicleType,
        double totalScore,
        Double etaScore,
        Double slaScore,
        Double zoneScore,
        Double distanceScore,
        Instant assignedAt,
        Instant pickedUpAt,
        Instant deliveredAt,
        Instant cancelledAt
) {}
