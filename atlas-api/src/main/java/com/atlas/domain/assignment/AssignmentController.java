package com.atlas.domain.assignment;

import com.atlas.common.dto.ApiResponse;
import com.atlas.domain.assignment.dto.AssignOrderRequest;
import com.atlas.domain.assignment.dto.AssignmentResponse;
import com.atlas.domain.assignment.dto.AssignmentSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping("/api/v1/orders/{orderId}/assign")
    public ResponseEntity<ApiResponse<AssignmentResponse>> assign(
            @PathVariable UUID orderId,
            @RequestBody(required = false) AssignOrderRequest request) {
        UUID courierId = request != null ? request.courierId() : null;
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok(assignmentService.assign(orderId, courierId)));
    }

    @GetMapping("/api/v1/assignments")
    public ResponseEntity<ApiResponse<List<AssignmentSummary>>> list(
            @RequestParam(required = false) UUID courierId,
            @RequestParam(required = false) UUID orderId,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(ApiResponse.ok(
                assignmentService.list(courierId, orderId, activeOnly)));
    }

    @GetMapping("/api/v1/assignments/{id}")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.getById(id)));
    }

    @PatchMapping("/api/v1/assignments/{id}/pickup")
    public ResponseEntity<ApiResponse<AssignmentResponse>> pickup(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.pickup(id)));
    }

    @PatchMapping("/api/v1/assignments/{id}/deliver")
    public ResponseEntity<ApiResponse<AssignmentResponse>> deliver(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(assignmentService.deliver(id)));
    }

    @DeleteMapping("/api/v1/assignments/{id}")
    public ResponseEntity<ApiResponse<Void>> cancel(@PathVariable UUID id) {
        assignmentService.cancel(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
