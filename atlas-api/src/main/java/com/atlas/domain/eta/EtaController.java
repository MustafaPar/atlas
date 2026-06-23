package com.atlas.domain.eta;

import com.atlas.common.dto.ApiResponse;
import com.atlas.domain.eta.dto.ComputeEtaRequest;
import com.atlas.domain.eta.dto.EtaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/eta")
@RequiredArgsConstructor
public class EtaController {

    private final EtaService etaService;

    @GetMapping
    public ResponseEntity<ApiResponse<EtaResponse>> get(@PathVariable UUID orderId) {
        return ResponseEntity.ok(ApiResponse.ok(etaService.getOrCompute(orderId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EtaResponse>> compute(
            @PathVariable UUID orderId,
            @RequestBody(required = false) ComputeEtaRequest request) {
        UUID courierId = request != null ? request.courierId() : null;
        return ResponseEntity.ok(ApiResponse.ok(etaService.computeForOrder(orderId, courierId)));
    }
}
