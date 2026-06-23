package com.atlas.domain.order.dto;

import com.atlas.domain.order.OrderPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateOrderRequest(

        @NotNull(message = "Pickup latitude is required")
        Double pickupLatitude,

        @NotNull(message = "Pickup longitude is required")
        Double pickupLongitude,

        @NotBlank(message = "Pickup address is required")
        @Size(max = 500, message = "Pickup address must not exceed 500 characters")
        String pickupAddress,

        @NotNull(message = "Delivery latitude is required")
        Double deliveryLatitude,

        @NotNull(message = "Delivery longitude is required")
        Double deliveryLongitude,

        @NotBlank(message = "Delivery address is required")
        @Size(max = 500, message = "Delivery address must not exceed 500 characters")
        String deliveryAddress,

        // Optional — defaults to NORMAL in the service if null
        OrderPriority priority
) {}
