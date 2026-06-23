-- ==========================================================================
-- V1 — Core schema
--
-- Creates the five base tables shared across all phases.
--
-- Columns that belong to later modules are intentionally absent here:
--   zone_id on couriers and orders  → added in V3 (Phase 3: Zone Management)
--   sla_tier, promised_delivery_at  → added in V6 (Phase 6: SLA System)
--   eta columns                     → added in V7 (Phase 7: ETA Engine)
--
-- Each migration must be independently runnable and reviewable.
-- A foreign key to a table that doesn't exist yet would break that guarantee.
-- ==========================================================================


-- --------------------------------------------------------------------------
-- users
-- Operators who manage the platform through the ops console.
-- --------------------------------------------------------------------------
CREATE TABLE users (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email      VARCHAR(255) UNIQUE NOT NULL,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'OPERATOR',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);


-- --------------------------------------------------------------------------
-- couriers
-- vehicle_type : BIKE | MOTORCYCLE | CAR
-- status       : AVAILABLE | DELIVERING | OFFLINE
--
-- zone_id FK is added in V3 after delivery_zones is created.
-- --------------------------------------------------------------------------
CREATE TABLE couriers (
    id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255)     NOT NULL,
    phone        VARCHAR(20)      NOT NULL,
    vehicle_type VARCHAR(20)      NOT NULL,
    status       VARCHAR(20)      NOT NULL DEFAULT 'OFFLINE',
    latitude     DOUBLE PRECISION,
    longitude    DOUBLE PRECISION,
    is_active    BOOLEAN          NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ      NOT NULL DEFAULT now()
);


-- --------------------------------------------------------------------------
-- orders
-- priority : LOW | NORMAL | HIGH | URGENT
-- status   : WAITING | ASSIGNED | PICKED_UP | DELIVERED
--
-- Zone columns (pickup_zone_id, delivery_zone_id) added in V3.
-- SLA columns (sla_tier, promised_delivery_at) added in V6.
-- --------------------------------------------------------------------------
CREATE TABLE orders (
    id                     UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_latitude        DOUBLE PRECISION NOT NULL,
    pickup_longitude       DOUBLE PRECISION NOT NULL,
    pickup_address         VARCHAR(500)     NOT NULL,
    delivery_latitude      DOUBLE PRECISION NOT NULL,
    delivery_longitude     DOUBLE PRECISION NOT NULL,
    delivery_address       VARCHAR(500)     NOT NULL,
    priority               VARCHAR(20)      NOT NULL DEFAULT 'NORMAL',
    status                 VARCHAR(20)      NOT NULL DEFAULT 'WAITING',
    estimated_duration_min INTEGER,
    created_at             TIMESTAMPTZ      NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ      NOT NULL DEFAULT now()
);


-- --------------------------------------------------------------------------
-- assignments
-- Links one courier to one order for the duration of a delivery.
-- UNIQUE on order_id enforces a single active assignment per order.
-- total_score is populated by the assignment engine (Phase 9).
-- --------------------------------------------------------------------------
CREATE TABLE assignments (
    id           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
    courier_id   UUID             NOT NULL REFERENCES couriers(id),
    order_id     UUID             NOT NULL UNIQUE REFERENCES orders(id),
    total_score  DOUBLE PRECISION NOT NULL DEFAULT 0,
    assigned_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);


-- --------------------------------------------------------------------------
-- location_history
-- Append-only movement trail written on every simulation tick.
-- Also feeds the delivery heatmap in the analytics dashboard.
-- --------------------------------------------------------------------------
CREATE TABLE location_history (
    id          BIGSERIAL        PRIMARY KEY,
    courier_id  UUID             NOT NULL REFERENCES couriers(id),
    latitude    DOUBLE PRECISION NOT NULL,
    longitude   DOUBLE PRECISION NOT NULL,
    recorded_at TIMESTAMPTZ      NOT NULL DEFAULT now()
);


-- --------------------------------------------------------------------------
-- Indexes
-- --------------------------------------------------------------------------
CREATE INDEX idx_couriers_status          ON couriers(status);
CREATE INDEX idx_couriers_active          ON couriers(is_active);
CREATE INDEX idx_orders_status            ON orders(status);
CREATE INDEX idx_orders_priority_created  ON orders(priority, created_at);
CREATE INDEX idx_assignments_courier      ON assignments(courier_id);
CREATE INDEX idx_location_history_courier ON location_history(courier_id, recorded_at DESC);
