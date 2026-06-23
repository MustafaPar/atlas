package com.atlas.domain.zone.dto;

import java.util.UUID;

public record ZoneResolveResponse(UUID zoneId, String slug, String zoneName) {}
