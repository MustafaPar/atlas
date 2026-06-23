package com.atlas.domain.assignment.dto;

import java.time.Instant;
import java.util.UUID;

public record AssignmentSummary(
        UUID id,
        UUID orderId,
        UUID courierId,
        String courierName,
        double totalScore,
        Instant assignedAt,
        Instant pickedUpAt,
        Instant deliveredAt,
        Instant cancelledAt
) {}
