package com.leadscraper.backend.dto.scraper;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ScrapeRequest(

        @NotBlank String keyword,

        @NotBlank String location,

        @Min(1) @Max(100) int maxLeads

) {
}