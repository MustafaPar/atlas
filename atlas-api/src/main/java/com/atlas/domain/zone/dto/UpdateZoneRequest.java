package com.atlas.domain.zone.dto;

import com.atlas.domain.zone.GeoPoint;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateZoneRequest(

        String name,

        String description,

        @Size(min = 3, message = "Polygon must have at least 3 vertices")
        List<@NotNull GeoPoint> polygon,

        @Positive(message = "Max capacity must be positive")
        Integer maxCapacity
) {}
