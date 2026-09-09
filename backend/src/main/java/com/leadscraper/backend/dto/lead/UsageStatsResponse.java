package com.leadscraper.backend.dto.lead;

public record UsageStatsResponse(
        long totalSearched,
        long totalDiscovered,
        long totalSaved,
        long totalEmailsFound,
        long totalEmailsVerified,
        long totalContactsRevealed,
        long totalListsCreated,
        int remainingCredits,
        int totalCredits
) {
}
