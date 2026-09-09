package com.leadscraper.backend.dto.employee;

public record EmployeeEmailCandidate(
                String email,
                String source,
                double confidence) {
}