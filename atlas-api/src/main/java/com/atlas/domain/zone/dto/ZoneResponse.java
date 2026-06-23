package com.atlas.domain.zone.dto;

import com.atlas.domain.zone.GeoPoint;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ZoneResponse(
        UUID id,
        String slug,
        String name,
        String description,
        List<GeoPoint> polygon,
        int maxCapacity,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {}
