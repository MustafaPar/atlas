package com.atlas.domain.zone;

import com.atlas.common.dto.ApiResponse;
import com.atlas.domain.zone.dto.CreateZoneRequest;
import com.atlas.domain.zone.dto.UpdateZoneRequest;
import com.atlas.domain.zone.dto.ZoneResponse;
import com.atlas.domain.zone.dto.ZoneResolveRequest;
import com.atlas.domain.zone.dto.ZoneResolveResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/zones")
@RequiredArgsConstructor
public class ZoneController {

    private final ZoneService zoneService;

    @PostMapping
    public ResponseEntity<ApiResponse<ZoneResponse>> create(
            @Valid @RequestBody CreateZoneRequest request) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(zoneService.create(request)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> listActive() {
        return ResponseEntity.ok(ApiResponse.ok(zoneService.listActive()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ZoneResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(zoneService.getById(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ZoneResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateZoneRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(zoneService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable UUID id) {
        zoneService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/resolve")
    public ResponseEntity<ApiResponse<List<ZoneResolveResponse>>> resolve(
            @Valid @RequestBody ZoneResolveRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(
                zoneService.resolve(request.latitude(), request.longitude())));
    }
}
