package com.atlas.domain.zone.dto;

import java.time.Instant;
import java.util.UUID;

public record ZoneSummary(
        UUID id,
        String slug,
        String name,
        int maxCapacity,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {}
