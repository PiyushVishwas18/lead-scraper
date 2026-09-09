package com.leadscraper.backend.dto.employee;

import jakarta.validation.constraints.NotBlank;

public record CreateEmployeeLeadRequest(

        @NotBlank String fullName,

        String firstName,
        String lastName,
        String jobTitle,
        String department,
        String seniority,
        String professionalUrl,

        @NotBlank String companyName,

        String companyWebsite,
        String companyDomain,
        String industry,

        String address,
        String city,
        String state,
        String country,

        String workEmail,
        String phone,

        String source,
        String sourceUrl,

        Double confidence

) {
}