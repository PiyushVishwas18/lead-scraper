package com.leadscraper.backend.dto.auth;

import java.util.List;
import java.util.UUID;

public record AuthUserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        List<String> roles) {
}