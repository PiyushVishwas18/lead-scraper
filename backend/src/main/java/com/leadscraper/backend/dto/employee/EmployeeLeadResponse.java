package com.leadscraper.backend.dto.employee;

import java.time.Instant;
import java.util.UUID;

public record EmployeeLeadResponse(

        UUID id,

        String fullName,
        String firstName,
        String lastName,
        String jobTitle,
        String department,
        String seniority,
        String professionalUrl,

        String companyName,
        String companyWebsite,
        String companyDomain,
        String industry,

        String address,
        String city,
        String state,
        String country,

        String workEmail,
        String phone,

        String emailStatus,
        Double emailVerificationConfidence,
        Instant emailVerifiedAt,

        String source,
        String sourceUrl,
        Double confidence,

        Boolean isDecisionMaker,

        String status,

        Integer qualityScore,

        Instant lastDiscoveredAt,
        String discoverySource,

        Instant createdAt,
        Instant updatedAt

) {
}