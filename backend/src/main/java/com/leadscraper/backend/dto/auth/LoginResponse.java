package com.leadscraper.backend.dto.auth;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresIn) {
}