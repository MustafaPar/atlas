-- ==========================================================================
-- V3 — Courier zone foreign key
--
-- Adds zone_id to couriers now that delivery_zones (V2) exists.
-- Nullable: a courier can operate without a zone assignment.
-- ==========================================================================

ALTER TABLE couriers ADD COLUMN zone_id UUID REFERENCES delivery_zones(id);

CREATE INDEX idx_couriers_zone ON couriers(zone_id);
