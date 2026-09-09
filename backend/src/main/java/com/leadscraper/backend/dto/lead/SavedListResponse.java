package com.leadscraper.backend.dto.lead;

import java.time.Instant;
import java.util.UUID;

public record SavedListResponse(
        UUID id,
        String name,
        String description,
        long leadCount,
        Instant createdAt,
        Instant updatedAt
) {
}
