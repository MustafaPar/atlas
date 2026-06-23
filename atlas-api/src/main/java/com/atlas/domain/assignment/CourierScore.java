package com.atlas.domain.assignment;

import com.atlas.domain.courier.Courier;
import com.atlas.domain.eta.EtaResult;

public record CourierScore(
        Courier courier,
        EtaResult etaResult,
        double etaScore,
        double slaScore,
        double zoneScore,
        double distanceScore,
        double totalScore
) {}
