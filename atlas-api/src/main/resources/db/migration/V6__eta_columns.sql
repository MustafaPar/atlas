-- ==========================================================================
-- V6 — ETA tracking columns
--
-- Adds ETA prediction fields to orders and delivery_zones.
-- Creates order_eta_snapshots for historical ETA accuracy per courier.
--
-- Snapshots are written only by the ETA endpoint (Phase 7).
-- The assignment engine (Phase 8) queries snapshots for courier scoring.
-- ==========================================================================


-- Persisted ETA fields on orders (last computed values — avoids join on every GET)
ALTER TABLE orders
    ADD COLUMN eta_minutes     INTEGER,
    ADD COLUMN eta_computed_at TIMESTAMPTZ,
    ADD COLUMN eta_confidence  DOUBLE PRECISION,
    ADD COLUMN eta_distance_km DOUBLE PRECISION;


-- Road-geometry multiplier per zone.
-- 1.2 means roads add ~20% over the straight-line haversine distance.
-- Operators can tune this per zone to reflect real traffic patterns.
ALTER TABLE delivery_zones
    ADD COLUMN route_factor DOUBLE PRECISION NOT NULL DEFAULT 1.2;


-- One row per explicit ETA computation event.
-- courier_id is nullable (null when computed without an assigned courier).
CREATE TABLE order_eta_snapshots (
    id            BIGSERIAL        PRIMARY KEY,
    order_id      UUID             NOT NULL REFERENCES orders(id),
    courier_id    UUID             REFERENCES couriers(id),
    eta_minutes   INTEGER          NOT NULL,
    confidence    DOUBLE PRECISION NOT NULL,
    distance_km   DOUBLE PRECISION NOT NULL,
    vehicle_type  VARCHAR(20),
    route_factor  DOUBLE PRECISION NOT NULL,
    computed_at   TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX idx_eta_snapshots_order   ON order_eta_snapshots(order_id,   computed_at DESC);
CREATE INDEX idx_eta_snapshots_courier ON order_eta_snapshots(courier_id, computed_at DESC);
