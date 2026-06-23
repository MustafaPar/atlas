-- ==========================================================================
-- V5 — Order SLA columns
--
-- Adds SLA metadata to orders as documented in V1.
-- All columns are nullable: orders without an SLA tier carry null values
-- and SlaEvaluator returns null status for them.
-- ==========================================================================

ALTER TABLE orders ADD COLUMN sla_tier             VARCHAR(20);
ALTER TABLE orders ADD COLUMN promised_delivery_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN delivered_at         TIMESTAMPTZ;

CREATE INDEX idx_orders_sla_tier             ON orders(sla_tier);
CREATE INDEX idx_orders_promised_delivery_at ON orders(promised_delivery_at);
