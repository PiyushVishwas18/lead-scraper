package com.leadscraper.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class LocationResolverService {

    private final RestClient restClient;

    public LocationResolverService() {
        this.restClient = RestClient.builder()
                .baseUrl("https://nominatim.openstreetmap.org")
                .defaultHeader(
                        "User-Agent",
                        "LeadScraper/1.0 (development)")
                .build();
    }

    public LocationResult resolve(String location) {

        LocationResult[] results = restClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/search")
                        .queryParam("q", location)
                        .queryParam("format", "json")
                        .queryParam("limit", 1)
                        .queryParam("addressdetails", 1)
                        .build())
                .retrieve()
                .body(LocationResult[].class);

        if (results == null || results.length == 0) {
            throw new IllegalArgumentException(
                    "Location not found: " + location);
        }

        return results[0];
    }

    public record LocationResult(
            String lat,
            String lon,
            String display_name,
            String[] boundingbox) {
    }
}