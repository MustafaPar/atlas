package com.atlas.domain.order;

import com.atlas.common.dto.ApiResponse;
import com.atlas.domain.order.dto.CreateOrderRequest;
import com.atlas.domain.order.dto.OrderResponse;
import com.atlas.domain.order.dto.OrderSummary;
import com.atlas.domain.order.dto.UpdateOrderStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(
            @Valid @RequestBody CreateOrderRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(orderService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderSummary>>> list(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) OrderPriority priority,
            @RequestParam(required = false) UUID pickupZoneId,
            @RequestParam(required = false) UUID deliveryZoneId) {
        return ResponseEntity.ok(ApiResponse.ok(
                orderService.list(status, priority, pickupZoneId, deliveryZoneId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getById(id)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.updateStatus(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.cancel(id)));
    }
}
