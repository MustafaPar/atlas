package com.atlas.domain.order.dto;

import com.atlas.domain.order.OrderPriority;
import com.atlas.domain.order.OrderStatus;
import com.atlas.domain.sla.SlaTier;
import com.atlas.domain.sla.SlaStatus;

import java.time.Instant;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        double pickupLatitude,
        double pickupLongitude,
        String pickupAddress,
        double deliveryLatitude,
        double deliveryLongitude,
        String deliveryAddress,
        OrderPriority priority,
        OrderStatus status,
        Integer estimatedDurationMin,
        SlaTier slaTier,
        Instant promisedDeliveryAt,
        Instant deliveredAt,
        SlaStatus slaStatus,
        UUID pickupZoneId,
        String pickupZoneSlug,
        String pickupZoneName,
        UUID deliveryZoneId,
        String deliveryZoneSlug,
        String deliveryZoneName,
        Instant createdAt,
        Instant updatedAt
) {}
