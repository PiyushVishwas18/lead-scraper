package com.leadscraper.backend.dto.employee;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SaveDiscoveredEmployeeRequest(

        @NotBlank String website,

        @NotNull @Valid DiscoveredEmployee employee

) {
}