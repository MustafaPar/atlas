package com.atlas.demo;

import com.atlas.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Demo-only controller. Provides a safe reset endpoint that restores the
 * database to the same state produced by scripts/demo-seed.sql.
 *
 * Demo credentials: demo@atlas.io / demo12345
 */
@RestController
@RequestMapping("/api/v1/demo")
@RequiredArgsConstructor
public class DemoController {

    private final JdbcTemplate jdbc;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/reset")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> reset() {

        // ── 1. Wipe in FK order (leave users intact) ─────────────────────
        jdbc.execute("DELETE FROM order_eta_snapshots");
        jdbc.execute("DELETE FROM location_history");
        jdbc.execute("DELETE FROM assignments");
        jdbc.execute("DELETE FROM orders");
        jdbc.execute("DELETE FROM couriers");
        jdbc.execute("DELETE FROM delivery_zones WHERE slug IN ('kadikoy','besiktas')");

        // ── 2. Upsert demo operator account ──────────────────────────────
        // ON CONFLICT preserves the existing UUID so active JWTs stay valid.
        String hash = passwordEncoder.encode("demo12345");
        jdbc.update("""
            INSERT INTO users (email, password, role)
            VALUES ('demo@atlas.io', ?, 'OPERATOR')
            ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
        """, hash);

        // ── 3. Delivery zones ─────────────────────────────────────────────
        jdbc.execute("""
            INSERT INTO delivery_zones (id, slug, name, description, polygon, max_capacity, is_active, route_factor) VALUES
            ('00000000-0000-0000-0000-000000000001','kadikoy','Kadikoy',
             'Kadikoy district on the Asian side of Istanbul',
             '[{"lat":40.980,"lng":29.027},{"lat":40.980,"lng":29.065},{"lat":41.005,"lng":29.065},{"lat":41.005,"lng":29.027}]',
             50, true, 1.25),
            ('00000000-0000-0000-0000-000000000002','besiktas','Besiktas',
             'Besiktas district on the European side of Istanbul',
             '[{"lat":41.040,"lng":28.960},{"lat":41.040,"lng":28.988},{"lat":41.047,"lng":28.988},{"lat":41.047,"lng":29.020},{"lat":41.080,"lng":29.020},{"lat":41.080,"lng":28.960}]',
             40, true, 1.30)
        """);

        // ── 4. Couriers ───────────────────────────────────────────────────
        jdbc.execute("""
            INSERT INTO couriers (name, phone, vehicle_type, status, latitude, longitude, is_active, zone_id) VALUES
            ('Ali Yilmaz',   '+90-555-0101', 'MOTORCYCLE', 'AVAILABLE', 40.990, 29.033, true, '00000000-0000-0000-0000-000000000001'),
            ('Mehmet Demir', '+90-555-0102', 'BIKE',       'AVAILABLE', 40.985, 29.032, true, '00000000-0000-0000-0000-000000000001'),
            ('Ayse Kaya',    '+90-555-0103', 'CAR',        'AVAILABLE', 41.049, 29.005, true, '00000000-0000-0000-0000-000000000002'),
            ('Can Ozturk',   '+90-555-0104', 'MOTORCYCLE', 'AVAILABLE', 41.055, 29.001, true, '00000000-0000-0000-0000-000000000002'),
            ('Emre Sahin',   '+90-555-0105', 'BIKE',       'AVAILABLE', 41.020, 29.022, true, NULL)
        """);

        // ── 5. Orders with live-computed SLA timestamps ───────────────────
        Instant now = Instant.now();
        Timestamp breached  = Timestamp.from(now.minus(3,  ChronoUnit.MINUTES));
        Timestamp atRisk    = Timestamp.from(now.plus(8,   ChronoUnit.MINUTES));
        Timestamp onTrack25 = Timestamp.from(now.plus(25,  ChronoUnit.MINUTES));
        Timestamp onTrack55 = Timestamp.from(now.plus(55,  ChronoUnit.MINUTES));

        jdbc.update("""
            INSERT INTO orders (
                pickup_latitude, pickup_longitude, pickup_address,
                delivery_latitude, delivery_longitude, delivery_address,
                priority, status, estimated_duration_min,
                sla_tier, promised_delivery_at,
                pickup_zone_id, delivery_zone_id, eta_minutes
            ) VALUES
            (40.985,29.039,'Bagdat Caddesi 42, Kadikoy',
             41.050,29.001,'Ihlamur Tesvikiye Yolu 8, Besiktas',
             'URGENT','WAITING',29,'PRIORITY',?,
             '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',37),
            (41.049,29.006,'Yildiz Caddesi 15, Besiktas',
             40.984,29.035,'Moda Caddesi 77, Kadikoy',
             'URGENT','WAITING',29,'PRIORITY',?,
             '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',44),
            (40.991,29.029,'Sogutlucesme Caddesi 3, Kadikoy',
             40.995,29.051,'Goztepe Mah. Caferaga Sokak, Kadikoy',
             'HIGH','WAITING',13,'EXPRESS',?,
             '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001',15),
            (41.043,28.980,'Serencebey Yokusu 22, Besiktas',
             41.067,29.013,'Barbaros Bulvari 120, Besiktas',
             'HIGH','WAITING',13,'EXPRESS',?,
             '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000002',16),
            (41.001,29.041,'Acibadem Caddesi 22, Kadikoy',
             41.079,29.018,'Levent Caddesi 9, Besiktas',
             'NORMAL','WAITING',30,'STANDARD',?,
             '00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',50),
            (41.065,28.975,'Balmumcu Mah. Barbaros Bulvari, Besiktas',
             40.983,29.055,'Caddebostan Mah., Kadikoy',
             'NORMAL','WAITING',30,'STANDARD',?,
             '00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001',44)
        """, breached, atRisk, onTrack25, onTrack25, onTrack55, onTrack55);

        return ResponseEntity.ok(ApiResponse.ok());
    }
}
