package com.atlas.domain.courier;

import com.atlas.common.exception.BusinessRuleException;
import com.atlas.common.exception.ResourceNotFoundException;
import com.atlas.common.util.PolygonUtils;
import com.atlas.domain.courier.dto.AssignZoneRequest;
import com.atlas.domain.courier.dto.CourierResponse;
import com.atlas.domain.courier.dto.CourierSummary;
import com.atlas.domain.courier.dto.CreateCourierRequest;
import com.atlas.domain.courier.dto.UpdateLocationRequest;
import com.atlas.domain.courier.dto.UpdateStatusRequest;
import com.atlas.domain.zone.DeliveryZone;
import com.atlas.domain.zone.ZoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CourierService {

    private final CourierRepository courierRepository;
    private final ZoneRepository zoneRepository;

    @Transactional
    public CourierResponse create(CreateCourierRequest request) {
        Courier courier = new Courier();
        courier.setName(request.name());
        courier.setPhone(request.phone());
        courier.setVehicleType(request.vehicleType());
        courier.setStatus(CourierStatus.OFFLINE);
        return toResponse(courierRepository.save(courier));
    }

    @Transactional(readOnly = true)
    public List<CourierSummary> list(CourierStatus status, UUID zoneId) {
        List<Courier> couriers;
        if (status != null && zoneId != null) {
            couriers = courierRepository.findAllByActiveTrueAndStatusAndZone_Id(status, zoneId);
        } else if (status != null) {
            couriers = courierRepository.findAllByActiveTrueAndStatus(status);
        } else if (zoneId != null) {
            couriers = courierRepository.findAllByActiveTrueAndZone_Id(zoneId);
        } else {
            couriers = courierRepository.findAllByActiveTrue();
        }
        return couriers.stream().map(this::toSummary).toList();
    }

    @Transactional(readOnly = true)
    public CourierResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public CourierResponse updateLocation(UUID id, UpdateLocationRequest request) {
        Courier courier = findOrThrow(id);
        courier.setLatitude(request.latitude());
        courier.setLongitude(request.longitude());
        return toResponse(courierRepository.save(courier));
    }

    @Transactional
    public CourierResponse updateStatus(UUID id, UpdateStatusRequest request) {
        if (request.status() == CourierStatus.DELIVERING) {
            throw new BusinessRuleException(
                    "Status DELIVERING can only be set by the assignment engine");
        }
        Courier courier = findOrThrow(id);
        courier.setStatus(request.status());
        return toResponse(courierRepository.save(courier));
    }

    @Transactional
    public CourierResponse assignZone(UUID id, AssignZoneRequest request) {
        Courier courier = findOrThrow(id);
        if (request.zoneId() == null) {
            courier.setZone(null);
        } else {
            DeliveryZone zone = zoneRepository.findById(request.zoneId())
                    .orElseThrow(() -> ResourceNotFoundException.of("DeliveryZone", request.zoneId()));
            if (!zone.isActive()) {
                throw new BusinessRuleException(
                        "Cannot assign courier to an inactive zone: " + zone.getSlug());
            }
            courier.setZone(zone);
        }
        return toResponse(courierRepository.save(courier));
    }

    @Transactional
    public void deactivate(UUID id) {
        Courier courier = findOrThrow(id);
        courier.setActive(false);
        courierRepository.save(courier);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Courier findOrThrow(UUID id) {
        return courierRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Courier", id));
    }

    private Boolean computeWithinZone(Courier courier) {
        if (courier.getZone() == null
                || courier.getLatitude() == null
                || courier.getLongitude() == null) {
            return null;
        }
        return PolygonUtils.contains(
                courier.getZone().getPolygon(),
                courier.getLatitude(),
                courier.getLongitude());
    }

    private CourierSummary toSummary(Courier courier) {
        return new CourierSummary(
                courier.getId(),
                courier.getName(),
                courier.getPhone(),
                courier.getVehicleType(),
                courier.getStatus(),
                courier.getZone() != null ? courier.getZone().getId() : null,
                courier.isActive());
    }

    private CourierResponse toResponse(Courier courier) {
        DeliveryZone zone = courier.getZone();
        return new CourierResponse(
                courier.getId(),
                courier.getName(),
                courier.getPhone(),
                courier.getVehicleType(),
                courier.getStatus(),
                courier.getLatitude(),
                courier.getLongitude(),
                zone != null ? zone.getId()   : null,
                zone != null ? zone.getSlug() : null,
                zone != null ? zone.getName() : null,
                courier.isActive(),
                computeWithinZone(courier),
                courier.getCreatedAt(),
                courier.getUpdatedAt());
    }
}
