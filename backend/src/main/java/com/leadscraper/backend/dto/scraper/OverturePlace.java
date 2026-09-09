package com.leadscraper.backend.dto.scraper;

public record OverturePlace(
        String name,
        String website,
        String phone,
        String email,
        String address,
        String city,
        String state,
        String country,
        double confidence) {
}