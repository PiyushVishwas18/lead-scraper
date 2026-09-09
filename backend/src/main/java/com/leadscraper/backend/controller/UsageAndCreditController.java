package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.lead.UsageStatsResponse;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.entity.UserCredit;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.service.CreditAndUsageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class UsageAndCreditController {

    private final CreditAndUsageService creditAndUsageService;
    private final UserRepository userRepository;

    public UsageAndCreditController(
            CreditAndUsageService creditAndUsageService,
            UserRepository userRepository) {
        this.creditAndUsageService = creditAndUsageService;
        this.userRepository = userRepository;
    }

    @GetMapping("/usage")
    public ResponseEntity<UsageStatsResponse> getUsageStats(
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        UsageStatsResponse stats = creditAndUsageService.getUsageStats(userId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/credits")
    public ResponseEntity<Map<String, Object>> getCredits(
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        UserCredit userCredit = creditAndUsageService.getOrCreateUserCredit(userId);
        return ResponseEntity.ok(Map.of(
                "totalCredits", userCredit.getTotalCredits(),
                "usedCredits", userCredit.getUsedCredits(),
                "remainingCredits", userCredit.getRemainingCredits()
        ));
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
        return user.getId();
    }
}
