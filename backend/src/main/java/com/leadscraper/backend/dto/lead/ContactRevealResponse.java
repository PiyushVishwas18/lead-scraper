package com.leadscraper.backend.dto.lead;

public record ContactRevealResponse(
        String email,
        String emailStatus,
        String phone,
        String source,
        String sourceUrl,
        boolean success,
        String message,
        int remainingCredits
) {
}
