package com.atlas.domain.auth.dto;

public record AuthResponse(String accessToken, String email, String role) {}
