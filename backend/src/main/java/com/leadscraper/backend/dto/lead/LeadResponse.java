package com.leadscraper.backend.dto.lead;

import java.time.Instant;
import java.util.UUID;

public record LeadResponse(
        UUID id,
        String companyName,
        String contactName,
        String email,
        String phone,
        String website,
        String address,
        String city,
        String state,
        String country,
        String source,
        String sourceUrl,
        String status,
        Instant createdAt,
        Instant updatedAt) {
}