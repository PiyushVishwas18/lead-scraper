package com.leadscraper.backend.dto.lead;

public record BatchAddLeadsResult(
        int addedCount,
        int alreadyPresentCount
) {
}
