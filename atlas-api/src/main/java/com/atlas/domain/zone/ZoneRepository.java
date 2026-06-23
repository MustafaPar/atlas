package com.atlas.domain.zone;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ZoneRepository extends JpaRepository<DeliveryZone, UUID> {

    List<DeliveryZone> findAllByActiveTrue();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, UUID id);

    Optional<DeliveryZone> findBySlug(String slug);
}
