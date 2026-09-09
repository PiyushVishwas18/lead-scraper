package com.leadscraper.backend.dto.lead;

import jakarta.validation.constraints.NotBlank;

public record CreateListRequest(
        @NotBlank String name,
        String description
) {
}
