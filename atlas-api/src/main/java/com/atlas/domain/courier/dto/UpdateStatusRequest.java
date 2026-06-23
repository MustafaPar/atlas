package com.atlas.domain.courier.dto;

import com.atlas.domain.courier.CourierStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull(message = "Status is required") CourierStatus status
) {}
