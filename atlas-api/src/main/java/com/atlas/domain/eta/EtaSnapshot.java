package com.atlas.domain.eta;

import com.atlas.domain.order.Order;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "order_eta_snapshots")
@Getter
@Setter
@NoArgsConstructor
public class EtaSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "courier_id")
    private UUID courierId;

    @Column(name = "eta_minutes", nullable = false)
    private int etaMinutes;

    @Column(nullable = false)
    private double confidence;

    @Column(name = "distance_km", nullable = false)
    private double distanceKm;

    @Column(name = "vehicle_type", length = 20)
    private String vehicleType;

    @Column(name = "route_factor", nullable = false)
    private double routeFactor;

    @Column(name = "computed_at", nullable = false)
    private Instant computedAt;
}
