package com.atlas.domain.courier.dto;

import java.util.UUID;

// zoneId is intentionally nullable — sending null removes the zone assignment.
public record AssignZoneRequest(UUID zoneId) {}
