package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.employee.EmployeeLeadResponse;
import com.leadscraper.backend.dto.lead.ContactRevealResponse;
import com.leadscraper.backend.dto.lead.SearchFilterRequest;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.service.ContactProviderService;
import com.leadscraper.backend.service.CreditAndUsageService;
import com.leadscraper.backend.service.PeopleSearchService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/people")
public class PeopleController {

    private final PeopleSearchService peopleSearchService;
    private final ContactProviderService contactProviderService;
    private final CreditAndUsageService creditAndUsageService;
    private final UserRepository userRepository;

    public PeopleController(
            PeopleSearchService peopleSearchService,
            ContactProviderService contactProviderService,
            CreditAndUsageService creditAndUsageService,
            UserRepository userRepository) {
        this.peopleSearchService = peopleSearchService;
        this.contactProviderService = contactProviderService;
        this.creditAndUsageService = creditAndUsageService;
        this.userRepository = userRepository;
    }

    @PostMapping("/search")
    public ResponseEntity<Page<EmployeeLeadResponse>> searchPeople(
            Authentication authentication,
            @RequestBody SearchFilterRequest request) {
        UUID userId = getUserId(authentication);
        creditAndUsageService.logUsage(userId, "PEOPLE_SEARCH", 1);
        Page<EmployeeLeadResponse> results = peopleSearchService.searchPeople(userId, request);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/count")
    public ResponseEntity<Map<String, Long>> countPeople(
            Authentication authentication,
            @RequestBody SearchFilterRequest request) {
        UUID userId = getUserId(authentication);
        long count = peopleSearchService.countPeople(userId, request);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PostMapping("/{leadId}/reveal-contact")
    public ResponseEntity<ContactRevealResponse> revealContact(
            Authentication authentication,
            @PathVariable UUID leadId) {
        UUID userId = getUserId(authentication);
        ContactRevealResponse response = contactProviderService.revealContact(userId, leadId);
        return ResponseEntity.ok(response);
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
        return user.getId();
    }
}
