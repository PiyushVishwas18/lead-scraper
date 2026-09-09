package com.leadscraper.backend.dto.employee;

public record DiscoveredEmployee(
        String fullName,
        String jobTitle,
        String professionalUrl,
        String sourceUrl,
        String email,
        String companyName,
        String companyWebsite,
        Double confidence,
        Boolean isDecisionMaker
) {
        public DiscoveredEmployee(
                        String fullName,
                        String jobTitle,
                        String professionalUrl,
                        String sourceUrl,
                        Double confidence,
                        Boolean isDecisionMaker) {
                this(fullName, jobTitle, professionalUrl, sourceUrl, null, null, null, confidence != null ? confidence : 0.0, isDecisionMaker);
        }

        public DiscoveredEmployee(
                        String fullName,
                        String jobTitle,
                        String professionalUrl,
                        String sourceUrl,
                        String email,
                        Double confidence,
                        Boolean isDecisionMaker) {
                this(fullName, jobTitle, professionalUrl, sourceUrl, email, null, null, confidence != null ? confidence : 0.0, isDecisionMaker);
        }
}