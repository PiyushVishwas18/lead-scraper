package com.leadscraper.backend.dto.lead;

import jakarta.validation.constraints.NotBlank;

public record UpdateLeadRequest(

        @NotBlank String companyName,

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
        String status

) {
}