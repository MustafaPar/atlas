package com.atlas.domain.zone.dto;

import jakarta.validation.constraints.NotNull;

public record ZoneResolveRequest(
        @NotNull(message = "Latitude is required") Double latitude,
        @NotNull(message = "Longitude is required") Double longitude
) {}
