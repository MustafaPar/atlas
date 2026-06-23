package com.atlas.domain.order.dto;

import com.atlas.domain.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
        @NotNull(message = "Status is required") OrderStatus status
) {}
