-- =============================================================================
-- Atlas Demo Seed
--
-- Inserts a working demo state: one operator account, two delivery zones,
-- five couriers, and six orders spanning all three SLA status values.
--
-- Prerequisites:
--   - PostgreSQL container must be running.
--   - The backend must have been started at least once so Flyway has run
--     migrations V1-V7 and created all required tables.
--
-- Run:
--   docker exec -i courierflow-postgres psql -U atlas -d atlas < scripts/demo-seed.sql
--
-- Login credentials after seeding:
--   Email:    demo@atlas.io
--   Password: Atlas2024!
-- =============================================================================

BEGIN;


-- -----------------------------------------------------------------------------
-- Clean up any previous seed data so re-running this script gives a clean state.
--
-- Deletion order follows FK dependency: dependents first, then parents.
--   order_eta_snapshots → orders, couriers
--   location_history    → couriers
--   assignments         → orders, couriers
--   orders              → delivery_zones (via pickup_zone_id / delivery_zone_id)
--   couriers            → delivery_zones (via zone_id)
-- -----------------------------------------------------------------------------
DELETE FROM order_eta_snapshots;
DELETE FROM location_history;
DELETE FROM assignments;
DELETE FROM orders;
DELETE FROM couriers;
DELETE FROM delivery_zones WHERE slug IN ('kadikoy', 'besiktas');
DELETE FROM users WHERE email = 'demo@atlas.io';


-- -----------------------------------------------------------------------------
-- Operator account
--
-- Password : Atlas2024!
-- Hash     : BCrypt cost 10, generated and verified with Spring Security
--            BCryptPasswordEncoder. Never stored as plain text.
-- -----------------------------------------------------------------------------
INSERT INTO users (email, password, role) VALUES (
    'demo@atlas.io',
    '$2a$10$eiED1Vs9JQqzD2uXhxjK8uCp8r/eJEyp0rPF6h5ibssmVsYWdzxnW',
    'OPERATOR'
);


-- -----------------------------------------------------------------------------
-- Delivery zones  (Istanbul — land-only polygons)
--
-- Fixed UUIDs allow courier and order inserts to reference them directly.
-- Polygon vertices follow the GeoPoint record format: {"lat": x, "lng": y}.
-- The ray-casting point-in-polygon algorithm in PolygonUtils requires at
-- least 3 vertices.
--
-- Kadikoy (Asian side):
--   Rectangular zone bounded lat 40.970-41.005, lng 29.025-29.060.
--   Western edge moved to 29.025 to stay clear of the Moda coastline
--   (~29.018-29.022 at lat 40.970-40.975).
--
-- Besiktas (European side):
--   L-shaped polygon to avoid the Bosphorus, which cuts into a simple
--   rectangle from the east. The European Bosphorus shore at the southern
--   end of Besiktas (lat 41.035-41.044) lies at lng ~29.004-29.009, so the
--   south section is capped at lng 28.998. Above lat 41.048 the coast
--   recedes east to ~29.027 (Ortaköy), so the north section widens to 29.018.
-- -----------------------------------------------------------------------------
INSERT INTO delivery_zones (id, slug, name, description, polygon, max_capacity, is_active, route_factor) VALUES

    -- Kadikoy: Asian side, lat 40.970-41.005, lng 29.025-29.060
    ('00000000-0000-0000-0000-000000000001',
     'kadikoy',
     'Kadikoy',
     'Kadikoy district on the Asian side of Istanbul',
     '[{"lat":40.970,"lng":29.025},{"lat":40.970,"lng":29.060},{"lat":41.005,"lng":29.060},{"lat":41.005,"lng":29.025}]',
     50, true, 1.25),

    -- Besiktas: European side, L-shaped to stay off the Bosphorus
    --   South section (lat 41.035-41.048): lng 28.975-28.998
    --   North section (lat 41.048-41.070): lng 28.975-29.018
    ('00000000-0000-0000-0000-000000000002',
     'besiktas',
     'Besiktas',
     'Besiktas district on the European side of Istanbul',
     '[{"lat":41.035,"lng":28.975},{"lat":41.035,"lng":28.998},{"lat":41.048,"lng":28.998},{"lat":41.048,"lng":29.018},{"lat":41.070,"lng":29.018},{"lat":41.070,"lng":28.975}]',
     40, true, 1.30);


-- -----------------------------------------------------------------------------
-- Couriers
--
-- All AVAILABLE. Coordinates placed on land within the assigned zone polygons.
-- Emre has no zone assignment (NULL zone_id) — valid and supported.
--
-- Coordinate notes:
--   Ayse Kaya  : moved from 29.005 to 28.990 — 29.005 falls outside the
--                Besiktas south section (capped at 28.998 to avoid Bosphorus).
--   Emre Sahin : moved from 29.015 to 29.022 — 29.015 is right on the
--                Üsküdar/Asian Bosphorus waterfront; 29.022 is inland Üsküdar.
-- -----------------------------------------------------------------------------
INSERT INTO couriers (name, phone, vehicle_type, status, latitude, longitude, is_active, zone_id) VALUES
    ('Ali Yilmaz',   '+90-555-0101', 'MOTORCYCLE', 'AVAILABLE', 40.990, 29.030, true, '00000000-0000-0000-0000-000000000001'),
    ('Mehmet Demir', '+90-555-0102', 'BIKE',       'AVAILABLE', 40.985, 29.028, true, '00000000-0000-0000-0000-000000000001'),
    ('Ayse Kaya',    '+90-555-0103', 'CAR',        'AVAILABLE', 41.045, 28.990, true, '00000000-0000-0000-0000-000000000002'),
    ('Can Ozturk',   '+90-555-0104', 'MOTORCYCLE', 'AVAILABLE', 41.050, 29.000, true, '00000000-0000-0000-0000-000000000002'),
    ('Emre Sahin',   '+90-555-0105', 'BIKE',       'AVAILABLE', 41.020, 29.022, true, NULL);


-- -----------------------------------------------------------------------------
-- Orders
--
-- All WAITING, ready to assign from the dashboard.
-- SLA status visible on first dashboard load:
--
--   Order 1  URGENT   BREACHED   deadline already passed
--   Order 2  URGENT   AT_RISK    8 min to PRIORITY deadline (threshold: 3 min)
--   Order 3  HIGH     ON_TRACK   25 min to EXPRESS deadline  (threshold: 6 min)
--   Order 4  HIGH     ON_TRACK   25 min to EXPRESS deadline
--   Order 5  NORMAL   ON_TRACK   55 min to STANDARD deadline (threshold: 12 min)
--   Order 6  NORMAL   ON_TRACK   55 min to STANDARD deadline
--
-- ETA fields are left null. The assignment engine computes them at assign time.
--
-- Coordinate notes:
--   Order 3 pickup : moved from 29.025 to 29.028 — 29.025 was on the Moda
--                    coastline edge; 29.028 is safely inland in Kadikoy.
-- -----------------------------------------------------------------------------
INSERT INTO orders (
    pickup_latitude,  pickup_longitude,  pickup_address,
    delivery_latitude, delivery_longitude, delivery_address,
    priority, status, estimated_duration_min,
    sla_tier, promised_delivery_at,
    pickup_zone_id, delivery_zone_id,
    eta_minutes
) VALUES

    -- 1: URGENT, Kadikoy -> Besiktas, BREACHED (deadline 3 min ago)
    --    ETA: 7.1 km * route_factor 1.30 / 15 km/h * 60 = 37 min
    (40.988, 29.040, 'Bagdat Caddesi 42, Kadikoy',
     41.048, 29.010, 'Ihlamur Yolu 8, Besiktas',
     'URGENT', 'WAITING', 29,
     'PRIORITY', now() - interval '3 minutes',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     37),

    -- 2: URGENT, Besiktas -> Kadikoy, AT_RISK (8 min to deadline)
    --    ETA: 8.8 km * route_factor 1.25 / 15 km/h * 60 = 44 min
    (41.055, 29.000, 'Ciragan Caddesi 15, Besiktas',
     40.980, 29.035, 'Moda Caddesi 77, Kadikoy',
     'URGENT', 'WAITING', 29,
     'PRIORITY', now() + interval '8 minutes',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     44),

    -- 3: HIGH, Kadikoy -> Kadikoy, ON_TRACK
    --    ETA: 3.1 km * route_factor 1.25 / 15 km/h * 60 = 15 min
    (40.975, 29.028, 'Sogutlucesme Caddesi 3, Kadikoy',
     40.995, 29.050, 'Fenerbahce Parki Girisi, Kadikoy',
     'HIGH', 'WAITING', 13,
     'EXPRESS', now() + interval '25 minutes',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     15),

    -- 4: HIGH, Besiktas -> Besiktas, ON_TRACK
    --    ETA: 3.0 km * route_factor 1.30 / 15 km/h * 60 = 16 min
    (41.040, 28.990, 'Barbaros Bulvari 120, Besiktas',
     41.060, 29.015, 'Yildiz Caddesi 5, Besiktas',
     'HIGH', 'WAITING', 13,
     'EXPRESS', now() + interval '25 minutes',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000002',
     16),

    -- 5: NORMAL, Kadikoy -> Besiktas, ON_TRACK
    --    ETA: 9.6 km * route_factor 1.30 / 15 km/h * 60 = 50 min
    (40.992, 29.045, 'Acibadem Caddesi 22, Kadikoy',
     41.065, 28.985, 'Levent Caddesi 9, Besiktas',
     'NORMAL', 'WAITING', 30,
     'STANDARD', now() + interval '55 minutes',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     50),

    -- 6: NORMAL, Besiktas -> Kadikoy, ON_TRACK
    --    ETA: 8.7 km * route_factor 1.25 / 15 km/h * 60 = 44 min
    (41.042, 28.995, 'Nisantasi Abdi Ipekci Caddesi 18, Besiktas',
     40.978, 29.055, 'Kalamis Mah. Kurbagalidere Caddesi, Kadikoy',
     'NORMAL', 'WAITING', 30,
     'STANDARD', now() + interval '55 minutes',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     44);


COMMIT;
