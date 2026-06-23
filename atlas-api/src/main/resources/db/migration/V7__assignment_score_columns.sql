-- ==========================================================================
-- V7 — Assignment score breakdown and partial order uniqueness
--
-- Adds per-component score columns so future analytics and explainability
-- phases can inspect individual scoring factors without re-computing.
--
-- Replaces the hard UNIQUE constraint on order_id (assignments_order_id_key,
-- confirmed from live schema) with a partial unique index so that a cancelled
-- assignment does not block re-assignment of the same order.
-- ==========================================================================


ALTER TABLE assignments
    ADD COLUMN eta_score      DOUBLE PRECISION,
    ADD COLUMN sla_score      DOUBLE PRECISION,
    ADD COLUMN zone_score     DOUBLE PRECISION,
    ADD COLUMN distance_score DOUBLE PRECISION,
    ADD COLUMN cancelled_at   TIMESTAMPTZ;


-- Constraint name verified from live database: assignments_order_id_key
ALTER TABLE assignments DROP CONSTRAINT assignments_order_id_key;

-- Partial unique index: at most one ACTIVE (non-cancelled) assignment per order.
-- Rows with cancelled_at IS NOT NULL are excluded, enabling cancel + re-assign.
CREATE UNIQUE INDEX idx_assignments_order_active
    ON assignments(order_id) WHERE cancelled_at IS NULL;


-- Supporting indexes
CREATE INDEX idx_assignments_order     ON assignments(order_id);
CREATE INDEX idx_assignments_cancelled ON assignments(cancelled_at);
