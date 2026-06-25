package com.atlas.domain.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Slf4j
@Service
public class JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiry-ms:86400000}")
    private long expiryMs;

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiryMs))
                .signWith(signingKey())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isValid(String token, UserDetails userDetails) {
        return extractUsername(token).equals(userDetails.getUsername())
                && !isExpired(token);
    }

    private boolean isExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    @PostConstruct
    void validateSecret() {
        byte[] keyBytes = resolveKeyBytes();
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET is too short (%d bytes). HS256 requires at least 32 bytes (256 bits). "
                .formatted(keyBytes.length) +
                "Generate one with: openssl rand -base64 32");
        }
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(resolveKeyBytes());
    }

    /**
     * Accepts the secret either as Base64 (preferred, see .env.example) or as a
     * plain UTF-8 string (convenient for local dev). Falls back to UTF-8 when
     * the value is not valid Base64.
     */
    private byte[] resolveKeyBytes() {
        try {
            return Decoders.BASE64.decode(secret);
        } catch (DecodingException | IllegalArgumentException e) {
            log.warn("JWT_SECRET is not valid Base64 — treating as raw UTF-8. "
                + "For production use a Base64-encoded secret (see .env.example).");
            return secret.getBytes(StandardCharsets.UTF_8);
        }
    }
}
