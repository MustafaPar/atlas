package com.atlas.domain.zone.dto;

import com.atlas.domain.zone.GeoPoint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateZoneRequest(

        @NotBlank(message = "Slug is required")
        @Pattern(regexp = "^[a-z0-9-]+$",
                message = "Slug must contain only lowercase letters, digits, and hyphens")
        @Size(max = 120, message = "Slug must not exceed 120 characters")
        String slug,

        @NotBlank(message = "Name is required")
        String name,

        String description,

        @NotNull(message = "Polygon is required")
        @Size(min = 3, message = "Polygon must have at least 3 vertices")
        List<@NotNull GeoPoint> polygon,

        @Positive(message = "Max capacity must be positive")
        int maxCapacity
) {}
