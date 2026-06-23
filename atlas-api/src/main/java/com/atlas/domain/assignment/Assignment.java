package com.atlas.domain.assignment;

import com.atlas.domain.courier.Courier;
import com.atlas.domain.order.Order;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "courier_id", nullable = false)
    private Courier courier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "total_score", nullable = false)
    private double totalScore;

    @Column(name = "eta_score")
    private Double etaScore;

    @Column(name = "sla_score")
    private Double slaScore;

    @Column(name = "zone_score")
    private Double zoneScore;

    @Column(name = "distance_score")
    private Double distanceScore;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    @Column(name = "picked_up_at")
    private Instant pickedUpAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;
}
