package com.atlas.domain.courier;

import com.atlas.common.dto.ApiResponse;
import com.atlas.domain.courier.dto.AssignZoneRequest;
import com.atlas.domain.courier.dto.CourierResponse;
import com.atlas.domain.courier.dto.CourierSummary;
import com.atlas.domain.courier.dto.CreateCourierRequest;
import com.atlas.domain.courier.dto.UpdateLocationRequest;
import com.atlas.domain.courier.dto.UpdateStatusRequest;
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
@RequestMapping("/api/v1/couriers")
@RequiredArgsConstructor
public class CourierController {

    private final CourierService courierService;

    @PostMapping
    public ResponseEntity<ApiResponse<CourierResponse>> create(
            @Valid @RequestBody CreateCourierRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(courierService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CourierSummary>>> list(
            @RequestParam(required = false) CourierStatus status,
            @RequestParam(required = false) UUID zoneId) {
        return ResponseEntity.ok(ApiResponse.ok(courierService.list(status, zoneId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourierResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(courierService.getById(id)));
    }

    @PatchMapping("/{id}/location")
    public ResponseEntity<ApiResponse<CourierResponse>> updateLocation(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLocationRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(courierService.updateLocation(id, request)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CourierResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(courierService.updateStatus(id, request)));
    }

    @PatchMapping("/{id}/zone")
    public ResponseEntity<ApiResponse<CourierResponse>> assignZone(
            @PathVariable UUID id,
            @RequestBody AssignZoneRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(courierService.assignZone(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        courierService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
