package com.atlas.domain.eta.dto;

import java.time.Instant;
import java.util.UUID;

public record EtaResponse(
        UUID orderId,
        UUID courierId,
        int etaMinutes,
        double distanceKm,
        double confidenceScore,
        Instant estimatedArrivalAt,
        Integer minutesToDeadline,
        Boolean slaFeasible,
        Instant computedAt
) {}
