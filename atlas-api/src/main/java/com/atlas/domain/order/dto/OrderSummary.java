package com.atlas.domain.order.dto;

import com.atlas.domain.order.OrderPriority;
import com.atlas.domain.order.OrderStatus;

import java.time.Instant;
import java.util.UUID;

public record OrderSummary(
        UUID id,
        OrderStatus status,
        OrderPriority priority,
        String pickupAddress,
        String deliveryAddress,
        UUID pickupZoneId,
        String pickupZoneSlug,
        String pickupZoneName,
        UUID deliveryZoneId,
        String deliveryZoneSlug,
        String deliveryZoneName,
        Instant createdAt
) {}
