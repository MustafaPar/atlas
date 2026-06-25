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
--   Password: demo12345
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
-- Password : demo12345
-- Hash     : BCrypt cost 10, generated and verified with Spring Security
--            BCryptPasswordEncoder. Never stored as plain text.
-- -----------------------------------------------------------------------------
INSERT INTO users (email, password, role) VALUES (
    'demo@atlas.io',
    '$2a$10$R/NQOGwCONEiKnpZLFshc.TSdWYEmjM1yXj3HK84Buzp/3LtaRbWS',
    'OPERATOR'
);


-- -----------------------------------------------------------------------------
-- Delivery zones  (Istanbul — land-only polygons, all vertices OSM-verified)
--
-- Fixed UUIDs allow courier and order inserts to reference them directly.
-- Polygon vertices follow the GeoPoint record format: {"lat": x, "lng": y}.
-- The ray-casting point-in-polygon algorithm in PolygonUtils requires at
-- least 3 vertices.
--
-- Kadikoy (Asian side):
--   Rectangle lat 40.980-41.005, lng 29.027-29.065.
--   South raised to 40.980 to clear Kalamis Bay (which extends to ~lat 40.978
--   at lng 29.042-29.062). Western edge at 29.027 stays east of the Moda
--   peninsula coast (~29.020 at lat 40.980).
--
-- Besiktas (European side):
--   L-shaped polygon. The Bosphorus European shore at lat 41.035-41.044 lies
--   at lng ~28.995-29.005, so the south section (lat 41.040-41.047) is capped
--   at lng 28.988 (Overpass-verified on land). Above lat 41.047 the coast
--   recedes east to ~29.024 (Ortakoy), so the north section widens to 29.020
--   (Overpass-verified on land at 41.047, 29.020).
-- -----------------------------------------------------------------------------
INSERT INTO delivery_zones (id, slug, name, description, polygon, max_capacity, is_active, route_factor) VALUES

    -- Kadikoy: Asian side, lat 40.980-41.005, lng 29.027-29.065
    ('00000000-0000-0000-0000-000000000001',
     'kadikoy',
     'Kadikoy',
     'Kadikoy district on the Asian side of Istanbul',
     '[{"lat":40.980,"lng":29.027},{"lat":40.980,"lng":29.065},{"lat":41.005,"lng":29.065},{"lat":41.005,"lng":29.027}]',
     50, true, 1.25),

    -- Besiktas: European side, L-shaped to stay off the Bosphorus
    --   South section (lat 41.040-41.047): lng 28.960-28.988
    --   North section (lat 41.047-41.080): lng 28.960-29.020
    ('00000000-0000-0000-0000-000000000002',
     'besiktas',
     'Besiktas',
     'Besiktas district on the European side of Istanbul',
     '[{"lat":41.040,"lng":28.960},{"lat":41.040,"lng":28.988},{"lat":41.047,"lng":28.988},{"lat":41.047,"lng":29.020},{"lat":41.080,"lng":29.020},{"lat":41.080,"lng":28.960}]',
     40, true, 1.30);


-- -----------------------------------------------------------------------------
-- Couriers
--
-- All AVAILABLE. Coordinates placed on land within the assigned zone polygons
-- and cross-checked via OSM Nominatim / Overpass is_in queries.
--
-- Coordinate notes:
--   Ali Yilmaz  : Sogutlucesme area, moved east to 29.033 to stay inside
--                 the new Kadikoy zone west boundary (29.027).
--   Mehmet Demir: Moda/Kadikoy area, moved east to 29.032 for same reason.
--   Ayse Kaya   : Moved from south section (41.045, 28.990) to north section
--                 near Yildiz Caddesi (OSM: 41.049, 29.006) — Besiktas inland.
--   Can Ozturk  : Ihlamur Tesvikiye Yolu area (OSM: 41.050, 29.001).
--   Emre Sahin  : No zone. Inland Uskudar on the Asian side (Bosphorus Asian
--                 shore at lat 41.020 is ~lng 29.013; 29.022 is safely inland).
-- -----------------------------------------------------------------------------
INSERT INTO couriers (name, phone, vehicle_type, status, latitude, longitude, is_active, zone_id) VALUES
    ('Ali Yilmaz',   '+90-555-0101', 'MOTORCYCLE', 'AVAILABLE', 40.990, 29.033, true, '00000000-0000-0000-0000-000000000001'),
    ('Mehmet Demir', '+90-555-0102', 'BIKE',       'AVAILABLE', 40.985, 29.032, true, '00000000-0000-0000-0000-000000000001'),
    ('Ayse Kaya',    '+90-555-0103', 'CAR',        'AVAILABLE', 41.049, 29.005, true, '00000000-0000-0000-0000-000000000002'),
    ('Can Ozturk',   '+90-555-0104', 'MOTORCYCLE', 'AVAILABLE', 41.055, 29.001, true, '00000000-0000-0000-0000-000000000002'),
    ('Emre Sahin',   '+90-555-0105', 'BIKE',       'AVAILABLE', 41.020, 29.022, true, NULL);


-- -----------------------------------------------------------------------------
-- Orders
--
-- All WAITING, ready to assign from the dashboard.
-- SLA status visible on first dashboard load:
--
--   Order 1  URGENT   BREACHED   deadline already passed
--   Order 2  URGENT   AT_RISK    8 min to PRIORITY deadline
--   Order 3  HIGH     ON_TRACK   25 min to EXPRESS deadline
--   Order 4  HIGH     ON_TRACK   25 min to EXPRESS deadline
--   Order 5  NORMAL   ON_TRACK   55 min to STANDARD deadline
--   Order 6  NORMAL   ON_TRACK   55 min to STANDARD deadline
--
-- ETA fields are left null. The assignment engine computes them at assign time.
--
-- All pickup/delivery coordinates verified on land via OSM Nominatim.
-- Street coordinates match actual OSM road centroids:
--   Bagdat Caddesi (Kadikoy)           : 40.985, 29.039
--   Ihlamur Tesvikiye Yolu (Besiktas)  : 41.050, 29.001
--   Yildiz Caddesi (Besiktas)          : 41.049, 29.006
--   Moda Caddesi tram stop (Kadikoy)   : 40.984, 29.035
--   Sogutlucesme Caddesi (Kadikoy)     : 40.991, 29.029
--   Acibadem Caddesi (Kadikoy)         : 41.001, 29.041
--   Barbaros Bulvari / Balmumcu        : 41.067, 29.013
--   Levent Caddesi (Besiktas/Levent)   : 41.079, 29.018
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
    (40.985, 29.039, 'Bagdat Caddesi 42, Kadikoy',
     41.050, 29.001, 'Ihlamur Tesvikiye Yolu 8, Besiktas',
     'URGENT', 'WAITING', 29,
     'PRIORITY', now() - interval '3 minutes',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     37),

    -- 2: URGENT, Besiktas -> Kadikoy, AT_RISK (8 min to deadline)
    (41.049, 29.006, 'Yildiz Caddesi 15, Besiktas',
     40.984, 29.035, 'Moda Caddesi 77, Kadikoy',
     'URGENT', 'WAITING', 29,
     'PRIORITY', now() + interval '8 minutes',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     44),

    -- 3: HIGH, Kadikoy -> Kadikoy, ON_TRACK
    (40.991, 29.029, 'Sogutlucesme Caddesi 3, Kadikoy',
     40.995, 29.051, 'Goztepe Mah. Caferaga Sokak, Kadikoy',
     'HIGH', 'WAITING', 13,
     'EXPRESS', now() + interval '25 minutes',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000001',
     15),

    -- 4: HIGH, Besiktas -> Besiktas, ON_TRACK
    --    Pickup in south section (lat 41.043, lng 28.980 — hillside Serencebey)
    --    Delivery at Barbaros Bulvari (OSM centroid: 41.067, 29.013)
    (41.043, 28.980, 'Serencebey Yokusu 22, Besiktas',
     41.067, 29.013, 'Barbaros Bulvari 120, Besiktas',
     'HIGH', 'WAITING', 13,
     'EXPRESS', now() + interval '25 minutes',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000002',
     16),

    -- 5: NORMAL, Kadikoy -> Besiktas, ON_TRACK
    --    Delivery at Levent Caddesi (OSM centroid: 41.079, 29.018)
    (41.001, 29.041, 'Acibadem Caddesi 22, Kadikoy',
     41.079, 29.018, 'Levent Caddesi 9, Besiktas',
     'NORMAL', 'WAITING', 30,
     'STANDARD', now() + interval '55 minutes',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     50),

    -- 6: NORMAL, Besiktas -> Kadikoy, ON_TRACK
    --    Pickup in north section, Balmumcu neighbourhood (lat 41.065, lng 28.975)
    (41.065, 28.975, 'Balmumcu Mah. Barbaros Bulvari, Besiktas',
     40.983, 29.055, 'Caddebostan Mah., Kadikoy',
     'NORMAL', 'WAITING', 30,
     'STANDARD', now() + interval '55 minutes',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-000000000001',
     44);


COMMIT;
