package com.leadscraper.backend.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import com.leadscraper.backend.service.DuckDbTestService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/duckdb")
public class DuckDbTestController {

    private final DuckDbTestService duckDbTestService;

    public DuckDbTestController(DuckDbTestService duckDbTestService) {
        this.duckDbTestService = duckDbTestService;
    }

    @GetMapping("/test")
    public String test() throws Exception {
        return duckDbTestService.testConnection();
    }

    @GetMapping("/overture")
    public String testOverture() throws Exception {
        return duckDbTestService.testOverture();
    }
}
