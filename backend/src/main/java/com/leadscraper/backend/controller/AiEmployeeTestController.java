package com.leadscraper.backend.controller;

import com.leadscraper.backend.service.AiEmployeeExtractionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiEmployeeTestController {

    private final AiEmployeeExtractionService aiService;

    public AiEmployeeTestController(
            AiEmployeeExtractionService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/extract-employees")
    public String extractEmployees(
            @RequestParam String sourceUrl,
            @RequestBody String pageText) {

        return aiService.extractEmployees(pageText, sourceUrl, 10);
    }
}