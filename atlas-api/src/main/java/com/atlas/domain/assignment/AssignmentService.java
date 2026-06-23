package com.atlas.domain.assignment;

import com.atlas.common.exception.BusinessRuleException;
import com.atlas.common.exception.ResourceNotFoundException;
import com.atlas.domain.assignment.dto.AssignOrderRequest;
import com.atlas.domain.assignment.dto.AssignmentResponse;
import com.atlas.domain.assignment.dto.AssignmentSummary;
import com.atlas.domain.courier.Courier;
import com.atlas.domain.courier.CourierRepository;
import com.atlas.domain.courier.CourierStatus;
import com.atlas.domain.order.Order;
import com.atlas.domain.order.OrderRepository;
import com.atlas.domain.order.OrderStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final OrderRepository      orderRepository;
    private final CourierRepository    courierRepository;

    @Transactional
    public AssignmentResponse assign(UUID orderId, UUID courierId) {
        Order order = findOrder(orderId);
        if (order.getStatus() != OrderStatus.WAITING) {
            throw new BusinessRuleException(
                    "Order must be WAITING to assign. Current status: " + order.getStatus());
        }

        CourierScore score;
        if (courierId != null) {
            Courier courier = findCourier(courierId);
            validateEligible(courier);
            score = AssignmentScorer.score(order, courier);
        } else {
            score = courierRepository.findAllByActiveTrueAndStatus(CourierStatus.AVAILABLE)
                    .stream()
                    .map(c -> AssignmentScorer.score(order, c))
                    .max(Comparator.comparingDouble(CourierScore::totalScore))
                    .orElseThrow(() -> new BusinessRuleException(
                            "No available couriers for order: " + orderId));
        }

        Courier courier = score.courier();

        Assignment assignment = new Assignment();
        assignment.setCourier(courier);
        assignment.setOrder(order);
        assignment.setTotalScore(score.totalScore());
        assignment.setEtaScore(score.etaScore());
        assignment.setSlaScore(score.slaScore());
        assignment.setZoneScore(score.zoneScore());
        assignment.setDistanceScore(score.distanceScore());
        assignment.setAssignedAt(Instant.now());

        order.setStatus(OrderStatus.ASSIGNED);
        courier.setStatus(CourierStatus.DELIVERING);

        orderRepository.save(order);
        courierRepository.save(courier);

        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional(readOnly = true)
    public List<AssignmentSummary> list(UUID courierId, UUID orderId, boolean activeOnly) {
        List<Assignment> results = assignmentRepository.findAllWithFilters(courierId, orderId);
        if (activeOnly) {
            results = results.stream()
                    .filter(a -> a.getCancelledAt() == null)
                    .toList();
        }
        return results.stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public AssignmentResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public AssignmentResponse pickup(UUID id) {
        Assignment assignment = findOrThrow(id);
        if (assignment.getCancelledAt() != null) {
            throw new BusinessRuleException("Assignment is cancelled");
        }
        if (assignment.getPickedUpAt() != null) {
            throw new BusinessRuleException("Order is already picked up");
        }
        assignment.setPickedUpAt(Instant.now());

        Order order = assignment.getOrder();
        order.setStatus(OrderStatus.PICKED_UP);
        orderRepository.save(order);

        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public AssignmentResponse deliver(UUID id) {
        Assignment assignment = findOrThrow(id);
        if (assignment.getCancelledAt() != null) {
            throw new BusinessRuleException("Assignment is cancelled");
        }
        if (assignment.getPickedUpAt() == null) {
            throw new BusinessRuleException("Order must be picked up before delivery");
        }
        if (assignment.getDeliveredAt() != null) {
            throw new BusinessRuleException("Order is already delivered");
        }
        Instant now = Instant.now();
        assignment.setDeliveredAt(now);

        Order order = assignment.getOrder();
        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(now);
        orderRepository.save(order);

        Courier courier = assignment.getCourier();
        courier.setStatus(CourierStatus.AVAILABLE);
        courierRepository.save(courier);

        return toResponse(assignmentRepository.save(assignment));
    }

    @Transactional
    public void cancel(UUID id) {
        Assignment assignment = findOrThrow(id);
        if (assignment.getDeliveredAt() != null) {
            throw new BusinessRuleException("Cannot cancel a delivered assignment");
        }
        if (assignment.getCancelledAt() != null) {
            throw new BusinessRuleException("Assignment is already cancelled");
        }
        assignment.setCancelledAt(Instant.now());

        Order order = assignment.getOrder();
        order.setStatus(OrderStatus.WAITING);
        orderRepository.save(order);

        Courier courier = assignment.getCourier();
        courier.setStatus(CourierStatus.AVAILABLE);
        courierRepository.save(courier);

        assignmentRepository.save(assignment);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateEligible(Courier courier) {
        if (!courier.isActive()) {
            throw new BusinessRuleException("Courier is inactive: " + courier.getId());
        }
        if (courier.getStatus() != CourierStatus.AVAILABLE) {
            throw new BusinessRuleException(
                    "Courier must be AVAILABLE to assign. Current status: " + courier.getStatus());
        }
    }

    private Assignment findOrThrow(UUID id) {
        return assignmentRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Assignment", id));
    }

    private Order findOrder(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Order", id));
    }

    private Courier findCourier(UUID id) {
        return courierRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Courier", id));
    }

    private AssignmentSummary toSummary(Assignment a) {
        return new AssignmentSummary(
                a.getId(),
                a.getOrder().getId(),
                a.getCourier().getId(),
                a.getCourier().getName(),
                a.getTotalScore(),
                a.getAssignedAt(),
                a.getPickedUpAt(),
                a.getDeliveredAt(),
                a.getCancelledAt());
    }

    private AssignmentResponse toResponse(Assignment a) {
        return new AssignmentResponse(
                a.getId(),
                a.getOrder().getId(),
                a.getCourier().getId(),
                a.getCourier().getName(),
                a.getCourier().getVehicleType(),
                a.getTotalScore(),
                a.getEtaScore(),
                a.getSlaScore(),
                a.getZoneScore(),
                a.getDistanceScore(),
                a.getAssignedAt(),
                a.getPickedUpAt(),
                a.getDeliveredAt(),
                a.getCancelledAt());
    }
}
