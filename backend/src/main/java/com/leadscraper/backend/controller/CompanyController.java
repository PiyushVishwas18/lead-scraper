package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.scraper.CompanySearchRequest;
import com.leadscraper.backend.dto.scraper.CompanySearchResult;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.service.CompanySearchService;
import com.leadscraper.backend.service.CreditAndUsageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanySearchService companySearchService;
    private final CreditAndUsageService creditAndUsageService;
    private final UserRepository userRepository;

    public CompanyController(
            CompanySearchService companySearchService,
            CreditAndUsageService creditAndUsageService,
            UserRepository userRepository) {
        this.companySearchService = companySearchService;
        this.creditAndUsageService = creditAndUsageService;
        this.userRepository = userRepository;
    }

    @PostMapping("/search")
    public ResponseEntity<List<CompanySearchResult>> searchCompanies(
            Authentication authentication,
            @RequestBody(required = false) CompanySearchRequest request) {
        UUID userId = getUserId(authentication);
        creditAndUsageService.logUsage(userId, "COMPANY_SEARCH", 1);
        List<CompanySearchResult> results = companySearchService.searchCompanies(request);
        return ResponseEntity.ok(results);
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
        return user.getId();
    }
}
