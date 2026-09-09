package com.leadscraper.backend.dto.lead;

public record SearchFilterRequest(
        String query,
        String jobTitle,
        String department,
        String seniority,
        String personName,
        String companyName,
        String companyDomain,
        String industry,
        String companySize,
        Integer minEmployees,
        Integer maxEmployees,
        String revenue,
        String funding,
        String technology,
        String city,
        String state,
        String country,
        String emailStatus,
        Boolean phoneAvailable,
        Boolean isDecisionMaker,
        String leadStatus,
        String sort,
        Integer page,
        Integer size
) {
    public SearchFilterRequest {
        if (page == null || page < 0) page = 0;
        if (size == null || size <= 0 || size > 100) size = 20;
    }
}
