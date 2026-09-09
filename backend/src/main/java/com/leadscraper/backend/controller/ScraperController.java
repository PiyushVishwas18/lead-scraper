package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.scraper.OverturePlace;
import com.leadscraper.backend.dto.scraper.ScrapeRequest;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.service.LeadService;
import com.leadscraper.backend.service.LocationResolverService;
import com.leadscraper.backend.service.ScraperService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/scraper")
public class ScraperController {

    private final ScraperService scraperService;
    private final LeadService leadService;
    private final UserRepository userRepository;
    private final LocationResolverService locationResolverService;

    public ScraperController(
            ScraperService scraperService,
            LeadService leadService,
            UserRepository userRepository,
            LocationResolverService locationResolverService) {

        this.scraperService = scraperService;
        this.leadService = leadService;
        this.userRepository = userRepository;
        this.locationResolverService = locationResolverService;
    }

    @GetMapping("/test")
    public ResponseEntity<ScraperService.ScrapedPage> testScraper(
            @RequestParam String url) throws Exception {

        return ResponseEntity.ok(
                scraperService.scrapePage(url));
    }

    @PostMapping("/search")
    public ResponseEntity<List<OverturePlace>> search(
            @Valid @RequestBody ScrapeRequest request) throws Exception {

        return ResponseEntity.ok(
                scraperService.searchPlaces(
                        request.keyword(),
                        request.location(),
                        request.maxLeads()));
    }

    @GetMapping("/location")
    public ResponseEntity<LocationResolverService.LocationResult> resolveLocation(
            @RequestParam String location) {

        return ResponseEntity.ok(
                locationResolverService.resolve(location));
    }

    private UUID getAuthenticatedUserId(Authentication authentication) {

        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated user no longer exists"));

        return user.getId();
    }
}