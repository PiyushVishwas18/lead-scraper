package com.leadscraper.backend.dto.scraper;

public record CompanySearchResult(
        String name,
        String website,
        String domain,
        String category,
        String address,
        String city,
        String state,
        String country,
        String phone,
        String companySize,
        Integer employeeCount,
        String revenue,
        String funding,
        String technology,
        String description,
        Integer foundedYear
) {
}
