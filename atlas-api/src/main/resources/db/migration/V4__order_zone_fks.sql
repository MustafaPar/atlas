-- ==========================================================================
-- V4 — Order zone foreign keys
--
-- Adds pickup_zone_id and delivery_zone_id to orders now that
-- delivery_zones (V2) exists. Both are nullable — a zone may not
-- contain the coordinate at creation time.
-- ==========================================================================

ALTER TABLE orders ADD COLUMN pickup_zone_id   UUID REFERENCES delivery_zones(id);
ALTER TABLE orders ADD COLUMN delivery_zone_id UUID REFERENCES delivery_zones(id);

CREATE INDEX idx_orders_pickup_zone   ON orders(pickup_zone_id);
CREATE INDEX idx_orders_delivery_zone ON orders(delivery_zone_id);
