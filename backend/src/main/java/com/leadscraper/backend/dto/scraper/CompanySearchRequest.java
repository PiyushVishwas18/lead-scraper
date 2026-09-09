package com.leadscraper.backend.dto.scraper;

public record CompanySearchRequest(
        String keyword,
        String location,
        String companyName,
        String domain,
        String industry,
        String country,
        String city,
        String state,
        String companySize,
        Integer minEmployees,
        Integer maxEmployees,
        String revenue,
        String funding,
        String technology,
        String companyType,
        Integer foundedYear,
        Integer page,
        Integer size
) {
    public CompanySearchRequest {
        if (page == null || page < 0) page = 0;
        if (size == null || size <= 0 || size > 100) size = 20;
    }
}
