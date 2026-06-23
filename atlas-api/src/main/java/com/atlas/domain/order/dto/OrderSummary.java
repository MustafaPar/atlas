package com.atlas.domain.order.dto;

import com.atlas.domain.order.OrderPriority;
import com.atlas.domain.order.OrderStatus;
import com.atlas.domain.sla.SlaTier;
import com.atlas.domain.sla.SlaStatus;

import java.time.Instant;
import java.util.UUID;

public record OrderSummary(
        UUID id,
        OrderStatus status,
        OrderPriority priority,
        SlaTier slaTier,
        SlaStatus slaStatus,
        String pickupAddress,
        String deliveryAddress,
        UUID pickupZoneId,
        String pickupZoneSlug,
        String pickupZoneName,
        UUID deliveryZoneId,
        String deliveryZoneSlug,
        String deliveryZoneName,
        Instant createdAt,
        Instant updatedAt
) {}
