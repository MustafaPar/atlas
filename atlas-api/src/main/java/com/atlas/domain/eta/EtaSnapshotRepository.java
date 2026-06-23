package com.atlas.domain.eta;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EtaSnapshotRepository extends JpaRepository<EtaSnapshot, Long> {

    List<EtaSnapshot> findAllByOrder_IdOrderByComputedAtDesc(UUID orderId);
}
