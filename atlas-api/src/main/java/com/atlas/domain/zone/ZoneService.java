package com.atlas.domain.zone;

import com.atlas.common.exception.BusinessRuleException;
import com.atlas.common.exception.ResourceNotFoundException;
import com.atlas.common.util.PolygonUtils;
import com.atlas.domain.zone.dto.CreateZoneRequest;
import com.atlas.domain.zone.dto.UpdateZoneRequest;
import com.atlas.domain.zone.dto.ZoneResponse;
import com.atlas.domain.zone.dto.ZoneResolveResponse;
import com.atlas.domain.zone.dto.ZoneSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ZoneService {

    private final ZoneRepository zoneRepository;

    @Transactional
    public ZoneResponse create(CreateZoneRequest request) {
        if (zoneRepository.existsBySlug(request.slug())) {
            throw new BusinessRuleException("Slug already in use: " + request.slug());
        }
        DeliveryZone zone = new DeliveryZone();
        zone.setSlug(request.slug());
        zone.setName(request.name());
        zone.setDescription(request.description());
        zone.setPolygon(request.polygon());
        zone.setMaxCapacity(request.maxCapacity());
        return toResponse(zoneRepository.save(zone));
    }

    @Transactional(readOnly = true)
    public List<ZoneSummary> listActive() {
        return zoneRepository.findAllByActiveTrue().stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public ZoneResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ZoneResponse update(UUID id, UpdateZoneRequest request) {
        DeliveryZone zone = findOrThrow(id);
        if (request.name() != null)        zone.setName(request.name());
        if (request.description() != null) zone.setDescription(request.description());
        if (request.polygon() != null)     zone.setPolygon(request.polygon());
        if (request.maxCapacity() != null) zone.setMaxCapacity(request.maxCapacity());
        return toResponse(zoneRepository.save(zone));
    }

    @Transactional
    public void deactivate(UUID id) {
        DeliveryZone zone = findOrThrow(id);
        zone.setActive(false);
        zoneRepository.save(zone);
    }

    @Transactional(readOnly = true)
    public List<ZoneResolveResponse> resolve(double latitude, double longitude) {
        return zoneRepository.findAllByActiveTrue().stream()
                .filter(z -> PolygonUtils.contains(z.getPolygon(), latitude, longitude))
                .map(z -> new ZoneResolveResponse(z.getId(), z.getSlug(), z.getName()))
                .toList();
    }

    private ZoneSummary toSummary(DeliveryZone zone) {
        return new ZoneSummary(
                zone.getId(),
                zone.getSlug(),
                zone.getName(),
                zone.getMaxCapacity(),
                zone.isActive(),
                zone.getCreatedAt(),
                zone.getUpdatedAt());
    }

    private DeliveryZone findOrThrow(UUID id) {
        return zoneRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("DeliveryZone", id));
    }

    private ZoneResponse toResponse(DeliveryZone zone) {
        return new ZoneResponse(
                zone.getId(),
                zone.getSlug(),
                zone.getName(),
                zone.getDescription(),
                zone.getPolygon(),
                zone.getMaxCapacity(),
                zone.isActive(),
                zone.getCreatedAt(),
                zone.getUpdatedAt());
    }
}
