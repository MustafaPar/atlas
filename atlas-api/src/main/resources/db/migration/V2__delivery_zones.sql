-- ==========================================================================
-- V2 — Delivery Zones
--
-- Creates the delivery_zones table.
-- zone_id FK columns on couriers and orders are added in V3.
-- ==========================================================================

CREATE TABLE delivery_zones (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug         VARCHAR(120) UNIQUE NOT NULL,
    name         VARCHAR(255) NOT NULL,
    description  VARCHAR(500),
    polygon      JSONB        NOT NULL,
    max_capacity INTEGER      NOT NULL DEFAULT 50,
    is_active    BOOLEAN      NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX idx_delivery_zones_slug   ON delivery_zones(slug);
