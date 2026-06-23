package com.atlas.domain.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("""
            SELECT o FROM Order o
            WHERE (:status IS NULL OR o.status = :status)
              AND (:priority IS NULL OR o.priority = :priority)
              AND (:pickupZoneId IS NULL OR o.pickupZone.id = :pickupZoneId)
              AND (:deliveryZoneId IS NULL OR o.deliveryZone.id = :deliveryZoneId)
            ORDER BY o.createdAt DESC
            """)
    List<Order> findAllWithFilters(
            @Param("status") OrderStatus status,
            @Param("priority") OrderPriority priority,
            @Param("pickupZoneId") UUID pickupZoneId,
            @Param("deliveryZoneId") UUID deliveryZoneId);
}
