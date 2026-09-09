package com.leadscraper.backend.controller;

import com.leadscraper.backend.service.GeminiService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GeminiTestController {

    private final GeminiService geminiService;

    public GeminiTestController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @GetMapping("/api/gemini/test")
    public String testGemini() {
        return geminiService.testConnection();
    }
}