package com.atlas.domain.eta;

import java.time.Instant;

public record EtaResult(
        int etaMinutes,
        double distanceKm,
        double confidenceScore,
        Instant computedAt,
        Instant estimatedArrivalAt,
        Integer minutesToDeadline,
        Boolean slaFeasible
) {}
