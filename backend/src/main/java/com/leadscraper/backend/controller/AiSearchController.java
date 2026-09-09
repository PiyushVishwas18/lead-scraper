package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.lead.SearchFilterRequest;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.service.AiSearchParsingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/search")
public class AiSearchController {

    private final AiSearchParsingService aiSearchParsingService;

    public AiSearchController(AiSearchParsingService aiSearchParsingService) {
        this.aiSearchParsingService = aiSearchParsingService;
    }

    @PostMapping("/ai-parse")
    public ResponseEntity<SearchFilterRequest> parseNaturalLanguageSearch(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> payload) {
        String prompt = payload.get("prompt");
        SearchFilterRequest parsed = aiSearchParsingService.parseNaturalLanguageQuery(prompt);
        return ResponseEntity.ok(parsed);
    }
}
