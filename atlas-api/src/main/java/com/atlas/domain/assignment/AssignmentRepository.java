package com.atlas.domain.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

    Optional<Assignment> findByOrder_IdAndCancelledAtIsNull(UUID orderId);

    @Query("""
            SELECT a FROM Assignment a
            WHERE (:courierId IS NULL OR a.courier.id = :courierId)
              AND (:orderId   IS NULL OR a.order.id   = :orderId)
            ORDER BY a.assignedAt DESC
            """)
    List<Assignment> findAllWithFilters(
            @Param("courierId") UUID courierId,
            @Param("orderId")   UUID orderId);
}
