package com.atlas.domain.courier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CourierRepository extends JpaRepository<Courier, UUID> {

    List<Courier> findAllByActiveTrue();

    List<Courier> findAllByActiveTrueAndStatus(CourierStatus status);

    List<Courier> findAllByActiveTrueAndZone_Id(UUID zoneId);

    List<Courier> findAllByActiveTrueAndStatusAndZone_Id(CourierStatus status, UUID zoneId);
}
