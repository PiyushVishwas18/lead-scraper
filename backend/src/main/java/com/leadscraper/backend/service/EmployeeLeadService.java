package com.leadscraper.backend.service;

import com.leadscraper.backend.entity.EmployeeLead;
import com.leadscraper.backend.repository.EmployeeLeadRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.leadscraper.backend.dto.employee.CreateEmployeeLeadRequest;
import com.leadscraper.backend.dto.employee.DiscoveredEmployee;
import com.leadscraper.backend.dto.employee.EmployeeLeadResponse;
import com.leadscraper.backend.dto.employee.EmployeeEmailCandidate;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
public class EmployeeLeadService {

        private final EmployeeLeadRepository employeeLeadRepository;
        private final AiEmployeeExtractionService aiEmployeeExtractionService;
        private final EmailVerificationService emailVerificationService;
        private final EmployeeDiscoveryService employeeDiscoveryService;

        public EmployeeLeadService(
                        EmployeeLeadRepository employeeLeadRepository,
                        AiEmployeeExtractionService aiEmployeeExtractionService,
                        EmailVerificationService emailVerificationService,
                        EmployeeDiscoveryService employeeDiscoveryService) {

                this.employeeLeadRepository = employeeLeadRepository;
                this.aiEmployeeExtractionService = aiEmployeeExtractionService;
                this.emailVerificationService = emailVerificationService;
                this.employeeDiscoveryService = employeeDiscoveryService;
        }

        @Transactional
        public EmployeeLeadResponse createLead(
                        UUID ownerId,
                        CreateEmployeeLeadRequest request) {

                Instant now = Instant.now();

                EmployeeLead lead = new EmployeeLead();

                lead.setOwnerId(ownerId);

                // Employee
                lead.setFullName(request.fullName().trim());
                lead.setFirstName(request.firstName());
                lead.setLastName(request.lastName());
                lead.setJobTitle(request.jobTitle());
                lead.setDepartment(request.department());
                lead.setSeniority(request.seniority());
                lead.setProfessionalUrl(request.professionalUrl());

                // Company
                lead.setCompanyName(request.companyName().trim());
                lead.setCompanyWebsite(request.companyWebsite());
                lead.setCompanyDomain(request.companyDomain());
                lead.setIndustry(request.industry());

                // Location
                lead.setAddress(request.address());
                lead.setCity(request.city());
                lead.setState(request.state());
                lead.setCountry(request.country());

                // Contact
                lead.setWorkEmail(request.workEmail());
                lead.setPhone(request.phone());

                // Email verification
                lead.setEmailStatus("NOT_CHECKED");
                lead.setEmailVerificationConfidence(null);
                lead.setEmailVerifiedAt(null);

                // Source
                lead.setSource(request.source());
                lead.setSourceUrl(request.sourceUrl());
                lead.setConfidence(request.confidence());

                // CRM
                lead.setStatus("NEW");

                lead.setCreatedAt(now);
                lead.setUpdatedAt(now);

                EmployeeLead savedLead = employeeLeadRepository.save(lead);

                return toResponse(savedLead);
        }

        /**
         * Saves one employee discovered by the AI scraper.
         *
         * Company information is derived from the supplied website,
         * so another Gemini request is not required.
         */
        @Transactional
        public EmployeeLeadResponse saveDiscoveredEmployee(
                        UUID ownerId,
                        String website,
                        DiscoveredEmployee employee) {

                if (employee == null
                                || employee.fullName() == null
                                || employee.fullName().isBlank()) {

                        throw new IllegalArgumentException(
                                        "Employee name is required");
                }

                String targetWebsite = website;
                if ((targetWebsite == null || targetWebsite.isBlank()) && employee.companyWebsite() != null && !employee.companyWebsite().isBlank()) {
                        targetWebsite = employee.companyWebsite();
                }
                if ((targetWebsite == null || targetWebsite.isBlank()) && employee.sourceUrl() != null && !employee.sourceUrl().isBlank()) {
                        targetWebsite = employee.sourceUrl();
                }
                if ((targetWebsite == null || targetWebsite.isBlank()) && employee.professionalUrl() != null && !employee.professionalUrl().isBlank()) {
                        targetWebsite = employee.professionalUrl();
                }

                if (targetWebsite == null || targetWebsite.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Website is required");
                }

                String normalizedWebsite = normalizeWebsite(targetWebsite);

                String companyDomain = extractDomain(normalizedWebsite);

                String companyName = (employee.companyName() != null && !employee.companyName().isBlank())
                                ? employee.companyName().trim()
                                : deriveCompanyName(companyDomain);

                /*
                 * Deduplication:
                 * Do not create another employee record if this employee
                 * already exists for the same owner and company.
                 */
                EmployeeLead existingLead = findDuplicateDiscoveredEmployee(
                                ownerId,
                                companyName,
                                companyDomain,
                                employee.fullName(),
                                employee.professionalUrl());

                if (existingLead != null) {

                        /*
                         * The employee was discovered again.
                         * Update discovery metadata, but DO NOT overwrite
                         * user-managed lead information such as status,
                         * email status, notes, etc.
                         */
                        existingLead.setLastDiscoveredAt(
                                        Instant.now());

                        existingLead.setDiscoverySource("AI");

                        /*
                         * Update information that comes directly from
                         * the discovery result when it is available.
                         */
                        if (employee.jobTitle() != null
                                        && !employee.jobTitle().isBlank()) {

                                existingLead.setJobTitle(
                                                employee.jobTitle());
                        }

                        if (employee.professionalUrl() != null
                                        && !employee.professionalUrl().isBlank()
                                        && (existingLead.getProfessionalUrl() == null
                                                        || existingLead.getProfessionalUrl().isBlank())) {

                                existingLead.setProfessionalUrl(
                                                employee.professionalUrl());
                        }

                        if (employee.sourceUrl() != null
                                        && !employee.sourceUrl().isBlank()) {

                                existingLead.setSourceUrl(
                                                employee.sourceUrl());
                        }

                        if (employee.email() != null
                                         && !employee.email().isBlank()
                                         && (existingLead.getWorkEmail() == null
                                                         || existingLead.getWorkEmail().isBlank())) {

                                 existingLead.setWorkEmail(
                                                 employee.email().trim().toLowerCase(Locale.ROOT));
                        }

                        if (employee.confidence() > 0) {

                                existingLead.setConfidence(
                                                employee.confidence());
                        }

                        existingLead.setIsDecisionMaker(
                                        employee.isDecisionMaker());

                        existingLead.setUpdatedAt(
                                        Instant.now());

                        EmployeeLead updatedLead = employeeLeadRepository.save(existingLead);

                        System.out.println(
                                        "[DEDUP] Employee already exists; discovery metadata updated: "
                                                        + updatedLead.getFullName()
                                                        + " @ "
                                                        + companyDomain);

                        return toResponse(updatedLead);
                }

                /*
                 * Build the normal lead request for a genuinely new employee.
                 */
                CreateEmployeeLeadRequest request = new CreateEmployeeLeadRequest(

                                employee.fullName(),

                                extractFirstName(
                                                employee.fullName()),

                                extractLastName(
                                                employee.fullName()),

                                employee.jobTitle(),

                                null, // department
                                null, // seniority

                                employee.professionalUrl(),

                                companyName,
                                normalizedWebsite,
                                companyDomain,

                                null, // industry

                                null, // address
                                null, // city
                                null, // state
                                null, // country

                                employee.email() != null ? employee.email().trim().toLowerCase(Locale.ROOT) : null,
                                null, // phone

                                "Source Page",
                                employee.sourceUrl(),
                                employee.confidence());

                /*
                 * Create the normal employee lead.
                 */
                EmployeeLeadResponse createdResponse = createLead(
                                ownerId,
                                request);

                /*
                 * Fetch the newly-created entity so we can store
                 * discovery-specific metadata.
                 */
                EmployeeLead savedLead = employeeLeadRepository
                                .findById(createdResponse.id())
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Created employee lead could not be found"));

                /*
                 * AI classification.
                 */
                savedLead.setIsDecisionMaker(
                                employee.isDecisionMaker());

                /*
                 * Persistent discovery tracking.
                 */
                savedLead.setLastDiscoveredAt(
                                Instant.now());

                savedLead.setDiscoverySource(
                                "AI");

                savedLead.setUpdatedAt(
                                Instant.now());

                EmployeeLead updatedLead = employeeLeadRepository.save(
                                savedLead);

                System.out.println(
                                "[DISCOVERY] New employee saved: "
                                                + updatedLead.getFullName()
                                                + " @ "
                                                + companyDomain);

                return toResponse(updatedLead);
        }

        @Transactional
        public List<EmployeeLeadResponse> saveDiscoveredEmployeesBatch(
                        UUID ownerId,
                        String website,
                        List<DiscoveredEmployee> employees) {

                if (employees == null || employees.isEmpty()) {
                        return List.of();
                }

                List<EmployeeLeadResponse> responses = new ArrayList<>();
                for (DiscoveredEmployee emp : employees) {
                        if (emp != null && emp.fullName() != null && !emp.fullName().isBlank()) {
                                responses.add(saveDiscoveredEmployee(ownerId, website, emp));
                        }
                }
                return responses;
        }

        @Transactional(readOnly = true)
        public boolean hasFreshDiscovery(
                        UUID ownerId,
                        String companyDomain,
                        long freshnessHours) {

                if (companyDomain == null || companyDomain.isBlank()) {
                        return false;
                }

                List<EmployeeLead> leads = employeeLeadRepository
                                .findByOwnerIdAndCompanyDomainIgnoreCaseOrderByLastDiscoveredAtDesc(
                                                ownerId,
                                                companyDomain);

                if (leads.isEmpty()) {
                        return false;
                }

                Instant latestDiscovery = leads.stream()
                                .map(EmployeeLead::getLastDiscoveredAt)
                                .filter(Objects::nonNull)
                                .max(Comparator.naturalOrder())
                                .orElse(null);

                if (latestDiscovery == null) {
                        return false;
                }

                Instant freshnessLimit = Instant.now().minusSeconds(
                                freshnessHours * 60L * 60L);

                return !latestDiscovery.isBefore(freshnessLimit);
        }

        private EmployeeLead findDuplicateDiscoveredEmployee(
                        UUID ownerId,
                        String companyName,
                        String companyDomain,
                        String fullName,
                        String professionalUrl) {

                List<EmployeeLead> companyLeads = employeeLeadRepository
                                .findByOwnerIdAndCompanyNameIgnoreCase(
                                                ownerId,
                                                companyName);

                String normalizedName = normalizePersonName(fullName);

                String normalizedProfessionalUrl = normalizeUrl(professionalUrl);

                for (EmployeeLead existing : companyLeads) {

                        String existingDomain = normalizeDomain(
                                        existing.getCompanyDomain());

                        String existingName = normalizePersonName(
                                        existing.getFullName());

                        /*
                         * If both records have a domain, require the domains
                         * to match.
                         */
                        boolean sameCompany = !companyDomain.isBlank()
                                        && !existingDomain.isBlank()
                                        && companyDomain.equalsIgnoreCase(
                                                        existingDomain);

                        if (!sameCompany) {
                                continue;
                        }

                        /*
                         * Professional URL is a strong identity signal.
                         */
                        if (!normalizedProfessionalUrl.isBlank()
                                        && normalizedProfessionalUrl.equals(
                                                        normalizeUrl(
                                                                        existing.getProfessionalUrl()))) {

                                return existing;
                        }

                        /*
                         * Fallback identity:
                         * same normalized full name + same company domain.
                         */
                        if (normalizedName.equals(existingName)) {
                                return existing;
                        }
                }

                return null;
        }

        private String normalizePersonName(String name) {

                if (name == null || name.isBlank()) {
                        return "";
                }

                return name
                                .toLowerCase(Locale.ROOT)
                                .replaceAll("[^a-z0-9]+", " ")
                                .trim()
                                .replaceAll("\\s+", " ");
        }

        private String normalizeDomain(String domain) {

                if (domain == null || domain.isBlank()) {
                        return "";
                }

                String value = domain
                                .trim()
                                .toLowerCase(Locale.ROOT);

                if (value.startsWith("www.")) {
                        value = value.substring(4);
                }

                return value;
        }

        private String normalizeUrl(String url) {

                if (url == null || url.isBlank()) {
                        return "";
                }

                String value = url
                                .trim()
                                .toLowerCase(Locale.ROOT);

                value = value.replaceFirst("^https?://", "");
                value = value.replaceFirst("^www\\.", "");
                value = value.replaceAll("/+$", "");

                return value;
        }

        @Transactional(readOnly = true)
        public Page<EmployeeLeadResponse> getMyLeads(
                        UUID ownerId,
                        String search,
                        String company,
                        Boolean decisionMaker,
                        String status,
                        String emailStatus,
                        String seniority,
                        String department,
                        String industry,
                        String city,
                        String state,
                        String country,
                        String sort,
                        int page,
                        int size) {

                String normalizedSearch = search == null
                                ? ""
                                : search.trim();

                String normalizedCompany = company == null
                                ? ""
                                : company.trim();

                String normalizedStatus = status == null
                                ? ""
                                : status.trim()
                                                .toUpperCase(Locale.ROOT);

                String normalizedEmailStatus = emailStatus == null
                                ? ""
                                : emailStatus.trim()
                                                .toUpperCase(Locale.ROOT);

                String normalizedSeniority = seniority == null
                                ? ""
                                : seniority.trim()
                                                .toUpperCase(Locale.ROOT);

                String normalizedDepartment = department == null
                                ? ""
                                : department.trim();

                String normalizedIndustry = industry == null
                                ? ""
                                : industry.trim();

                String normalizedCity = city == null
                                ? ""
                                : city.trim();

                String normalizedState = state == null
                                ? ""
                                : state.trim();

                String normalizedCountry = country == null
                                ? ""
                                : country.trim();

                String normalizedSort = sort == null
                                ? "newest"
                                : sort.trim()
                                                .toLowerCase(Locale.ROOT);

                /*
                 * Validate pagination.
                 */
                if (page < 0) {

                        throw new IllegalArgumentException(
                                        "Page must be greater than or equal to 0");
                }

                if (size < 1 || size > 100) {

                        throw new IllegalArgumentException(
                                        "Page size must be between 1 and 100");
                }

                /*
                 * Start with all leads belonging to the authenticated user.
                 */
                List<EmployeeLead> allLeads = employeeLeadRepository
                                .findByOwnerId(ownerId);

                /*
                 * Apply company filter.
                 */
                List<EmployeeLead> filteredLeads = allLeads.stream()
                                .filter(lead -> normalizedCompany.isBlank()
                                                || containsIgnoreCase(
                                                                lead.getCompanyName(),
                                                                normalizedCompany))
                                .toList();

                /*
                 * Apply decision-maker filter.
                 */
                if (decisionMaker != null) {

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> Objects.equals(
                                                        lead.getIsDecisionMaker(),
                                                        decisionMaker))
                                        .toList();
                }

                /*
                 * Apply lead-status filter.
                 */
                if (!normalizedStatus.isBlank()) {

                        if (!isValidStatus(normalizedStatus)) {

                                throw new IllegalArgumentException(
                                                "Invalid lead status: "
                                                                + status);
                        }

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> normalizedStatus.equals(
                                                        lead.getStatus()))
                                        .toList();
                }

                /*
                 * Apply email-status filter.
                 */
                if (!normalizedEmailStatus.isBlank()) {

                        if (!isValidEmailStatus(
                                        normalizedEmailStatus)) {

                                throw new IllegalArgumentException(
                                                "Invalid email status: "
                                                                + emailStatus);
                        }

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> normalizedEmailStatus.equals(
                                                        lead.getEmailStatus()))
                                        .toList();
                }

                /*
                 * Apply seniority filter.
                 */
                if (!normalizedSeniority.isBlank()) {

                        if (!isValidSeniority(
                                        normalizedSeniority)) {

                                throw new IllegalArgumentException(
                                                "Invalid seniority: "
                                                                + seniority);
                        }

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> normalizedSeniority.equals(
                                                        lead.getSeniority()))
                                        .toList();
                }

                /*
                 * Apply department filter.
                 */
                if (!normalizedDepartment.isBlank()) {

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> containsIgnoreCase(
                                                        lead.getDepartment(),
                                                        normalizedDepartment))
                                        .toList();
                }

                /*
                 * Apply industry filter.
                 */
                if (!normalizedIndustry.isBlank()) {

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> containsIgnoreCase(
                                                        lead.getIndustry(),
                                                        normalizedIndustry))
                                        .toList();
                }

                /*
                 * Apply city filter.
                 */
                if (!normalizedCity.isBlank()) {

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> containsIgnoreCase(
                                                        lead.getCity(),
                                                        normalizedCity))
                                        .toList();
                }

                /*
                 * Apply state filter.
                 */
                if (!normalizedState.isBlank()) {

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> containsIgnoreCase(
                                                        lead.getState(),
                                                        normalizedState))
                                        .toList();
                }

                /*
                 * Apply country filter.
                 */
                if (!normalizedCountry.isBlank()) {

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> containsIgnoreCase(
                                                        lead.getCountry(),
                                                        normalizedCountry))
                                        .toList();
                }

                /*
                 * Apply text search.
                 *
                 * Search fields:
                 * - employee name
                 * - job title
                 * - company name
                 */
                if (!normalizedSearch.isBlank()) {

                        filteredLeads = filteredLeads.stream()
                                        .filter(lead -> containsIgnoreCase(
                                                        lead.getFullName(),
                                                        normalizedSearch)
                                                        || containsIgnoreCase(
                                                                        lead.getJobTitle(),
                                                                        normalizedSearch)
                                                        || containsIgnoreCase(
                                                                        lead.getCompanyName(),
                                                                        normalizedSearch))
                                        .toList();
                }

                /*
                 * Apply sorting.
                 */
                Comparator<EmployeeLead> comparator;

                switch (normalizedSort) {

                        case "newest":

                                comparator = Comparator.comparing(
                                                EmployeeLead::getCreatedAt,
                                                Comparator.nullsLast(
                                                                Comparator.naturalOrder()))
                                                .reversed();

                                break;

                        case "oldest":

                                comparator = Comparator.comparing(
                                                EmployeeLead::getCreatedAt,
                                                Comparator.nullsLast(
                                                                Comparator.naturalOrder()));

                                break;

                        case "nameasc":

                                comparator = Comparator.comparing(
                                                (EmployeeLead lead) -> lead.getFullName() == null
                                                                ? ""
                                                                : lead.getFullName()
                                                                                .toLowerCase(Locale.ROOT));

                                break;

                        case "namedesc":

                                comparator = Comparator.comparing(
                                                (EmployeeLead lead) -> lead.getFullName() == null
                                                                ? ""
                                                                : lead.getFullName()
                                                                                .toLowerCase(Locale.ROOT))
                                                .reversed();

                                break;

                        case "confidencehigh":

                                comparator = Comparator.comparing(
                                                EmployeeLead::getConfidence,
                                                Comparator.nullsLast(
                                                                Comparator.naturalOrder()))
                                                .reversed();

                                break;

                        case "confidencelow":

                                comparator = Comparator.comparing(
                                                EmployeeLead::getConfidence,
                                                Comparator.nullsLast(
                                                                Comparator.naturalOrder()));

                                break;

                        default:

                                throw new IllegalArgumentException(
                                                "Invalid sort option: "
                                                                + sort);
                }

                filteredLeads = filteredLeads.stream()
                                .sorted(comparator)
                                .toList();

                /*
                 * Apply pagination after filtering and sorting.
                 */
                Pageable pageable = PageRequest.of(
                                page,
                                size);

                int start = (int) pageable.getOffset();

                int end = Math.min(
                                start + pageable.getPageSize(),
                                filteredLeads.size());

                List<EmployeeLead> pageContent;

                if (start >= filteredLeads.size()) {

                        pageContent = List.of();

                } else {

                        pageContent = filteredLeads.subList(
                                        start,
                                        end);
                }

                List<EmployeeLeadResponse> responseContent = pageContent.stream()
                                .map(this::toResponse)
                                .toList();

                return new PageImpl<>(
                                responseContent,
                                pageable,
                                filteredLeads.size());
        }

        @Transactional(readOnly = true)
        public List<DiscoveredEmployee> getCachedDiscoveredEmployees(
                        UUID ownerId,
                        String companyDomain,
                        int maxEmployees) {

                if (companyDomain == null || companyDomain.isBlank()) {
                        return List.of();
                }

                List<EmployeeLead> leads = employeeLeadRepository
                                .findByOwnerIdAndCompanyDomainIgnoreCaseOrderByLastDiscoveredAtDesc(
                                                ownerId,
                                                companyDomain);

                if (leads.isEmpty()) {
                        return List.of();
                }

                return leads.stream()
                                .limit(maxEmployees)
                                .map(lead -> new DiscoveredEmployee(
                                                lead.getFullName(),
                                                lead.getJobTitle(),
                                                lead.getProfessionalUrl(),
                                                lead.getSourceUrl(),
                                                lead.getConfidence() == null
                                                                ? 0.0
                                                                : lead.getConfidence(),
                                                lead.getIsDecisionMaker()))
                                .toList();
        }

        private boolean containsIgnoreCase(
                        String value,
                        String searchValue) {

                if (value == null || searchValue == null) {
                        return false;
                }

                return value
                                .toLowerCase(Locale.ROOT)
                                .contains(
                                                searchValue.toLowerCase(
                                                                Locale.ROOT));
        }

        @Transactional
        public void deleteLead(
                        UUID ownerId,
                        UUID leadId) {

                EmployeeLead lead = employeeLeadRepository
                                .findById(leadId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Employee lead not found"));

                verifyOwnership(
                                ownerId,
                                lead);

                employeeLeadRepository.delete(lead);
        }

        @Transactional
        public int bulkDeleteLeads(
                        UUID ownerId,
                        List<UUID> leadIds) {

                if (leadIds == null || leadIds.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "At least one lead ID is required");
                }

                int deletedCount = 0;

                for (UUID leadId : leadIds) {

                        if (leadId == null) {
                                continue;
                        }

                        EmployeeLead lead = employeeLeadRepository
                                        .findById(leadId)
                                        .orElseThrow(
                                                        () -> new IllegalArgumentException(
                                                                        "Employee lead not found: "
                                                                                        + leadId));

                        verifyOwnership(
                                        ownerId,
                                        lead);

                        employeeLeadRepository.delete(lead);

                        deletedCount++;
                }

                return deletedCount;
        }

        @Transactional
        public int bulkUpdateStatus(
                        UUID ownerId,
                        List<UUID> leadIds,
                        String status) {

                if (leadIds == null || leadIds.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "At least one lead ID is required");
                }

                if (status == null || status.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Lead status is required");
                }

                String normalizedStatus = status
                                .trim()
                                .toUpperCase(Locale.ROOT);

                if (!isValidStatus(normalizedStatus)) {
                        throw new IllegalArgumentException(
                                        "Invalid lead status: " + status);
                }

                int updatedCount = 0;

                for (UUID leadId : leadIds) {

                        if (leadId == null) {
                                continue;
                        }

                        EmployeeLead lead = employeeLeadRepository
                                        .findById(leadId)
                                        .orElseThrow(
                                                        () -> new IllegalArgumentException(
                                                                        "Employee lead not found: "
                                                                                        + leadId));

                        verifyOwnership(
                                        ownerId,
                                        lead);

                        lead.setStatus(normalizedStatus);
                        lead.setUpdatedAt(Instant.now());

                        employeeLeadRepository.save(lead);

                        updatedCount++;
                }

                return updatedCount;
        }

        @Transactional
        public int bulkUpdateEmailStatus(
                        UUID ownerId,
                        List<UUID> leadIds,
                        String emailStatus,
                        Double verificationConfidence) {

                if (leadIds == null || leadIds.isEmpty()) {
                        throw new IllegalArgumentException(
                                        "At least one lead ID is required");
                }

                if (emailStatus == null || emailStatus.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Email status is required");
                }

                String normalizedStatus = emailStatus
                                .trim()
                                .toUpperCase(Locale.ROOT);

                if (!isValidEmailStatus(normalizedStatus)) {
                        throw new IllegalArgumentException(
                                        "Invalid email status: " + emailStatus);
                }

                int updatedCount = 0;

                for (UUID leadId : leadIds) {

                        if (leadId == null) {
                                continue;
                        }

                        EmployeeLead lead = employeeLeadRepository
                                        .findById(leadId)
                                        .orElseThrow(
                                                        () -> new IllegalArgumentException(
                                                                        "Employee lead not found: "
                                                                                        + leadId));

                        verifyOwnership(
                                        ownerId,
                                        lead);

                        lead.setEmailStatus(normalizedStatus);
                        lead.setEmailVerificationConfidence(
                                        verificationConfidence);

                        if ("VALID".equals(normalizedStatus)
                                        || "INVALID".equals(normalizedStatus)) {

                                lead.setEmailVerifiedAt(
                                                Instant.now());

                        } else {

                                lead.setEmailVerifiedAt(null);
                        }

                        lead.setUpdatedAt(
                                        Instant.now());

                        employeeLeadRepository.save(lead);

                        updatedCount++;
                }

                return updatedCount;
        }

        @Transactional
        public EmployeeLeadResponse updateStatus(
                        UUID ownerId,
                        UUID leadId,
                        String status) {

                String normalizedStatus = status.trim()
                                .toUpperCase(Locale.ROOT);

                if (!isValidStatus(
                                normalizedStatus)) {

                        throw new IllegalArgumentException(
                                        "Invalid lead status: "
                                                        + status);
                }

                EmployeeLead lead = employeeLeadRepository
                                .findById(leadId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Employee lead not found"));

                verifyOwnership(
                                ownerId,
                                lead);

                lead.setStatus(normalizedStatus);
                lead.setUpdatedAt(Instant.now());

                return toResponse(
                                employeeLeadRepository.save(lead));
        }

        @Transactional
        public EmployeeLeadResponse updateEmailStatus(
                        UUID ownerId,
                        UUID leadId,
                        String emailStatus,
                        Double verificationConfidence) {

                String normalizedStatus = emailStatus.trim()
                                .toUpperCase(Locale.ROOT);

                if (!isValidEmailStatus(
                                normalizedStatus)) {

                        throw new IllegalArgumentException(
                                        "Invalid email status: "
                                                        + emailStatus);
                }

                EmployeeLead lead = employeeLeadRepository
                                .findById(leadId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Employee lead not found"));

                verifyOwnership(
                                ownerId,
                                lead);

                lead.setEmailStatus(
                                normalizedStatus);

                lead.setEmailVerificationConfidence(
                                verificationConfidence);

                if ("VALID".equals(normalizedStatus)
                                || "INVALID".equals(normalizedStatus)) {

                        lead.setEmailVerifiedAt(
                                        Instant.now());

                } else {

                        lead.setEmailVerifiedAt(null);
                }

                lead.setUpdatedAt(
                                Instant.now());

                return toResponse(
                                employeeLeadRepository.save(lead));
        }

        @Transactional
        public EmployeeLeadResponse verifyEmail(
                        UUID ownerId,
                        UUID leadId,
                        String email) {

                EmployeeLead lead = employeeLeadRepository
                                .findById(leadId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Employee lead not found"));

                verifyOwnership(
                                ownerId,
                                lead);

                if (email == null || email.isBlank()) {
                        throw new IllegalArgumentException(
                                        "Email is required");
                }

                EmailVerificationService.VerificationResult result = emailVerificationService.verify(email);

                /*
                 * Store the result only if the verification is for this lead.
                 */
                lead.setWorkEmail(result.email());
                lead.setEmailStatus(result.status());
                lead.setEmailVerificationConfidence(
                                result.confidence());

                if ("VALID".equals(result.status())
                                || "INVALID".equals(result.status())) {

                        lead.setEmailVerifiedAt(
                                        Instant.now());

                } else {

                        lead.setEmailVerifiedAt(null);
                }

                lead.setUpdatedAt(
                                Instant.now());

                return toResponse(
                                employeeLeadRepository.save(lead));
        }

        private void verifyOwnership(
                        UUID ownerId,
                        EmployeeLead lead) {

                if (!lead.getOwnerId()
                                .equals(ownerId)) {

                        throw new IllegalArgumentException(
                                        "You are not allowed to access this employee lead");
                }
        }

        private boolean isValidStatus(
                        String status) {

                return status.equals("NEW")
                                || status.equals("CONTACTED")
                                || status.equals("QUALIFIED")
                                || status.equals("CONVERTED")
                                || status.equals("REJECTED");
        }

        private boolean isValidEmailStatus(
                        String emailStatus) {

                return emailStatus.equals("NOT_CHECKED")
                                || emailStatus.equals("VALID")
                                || emailStatus.equals("INVALID")
                                || emailStatus.equals("UNKNOWN");
        }

        private boolean isValidSeniority(
                        String seniority) {

                return "EXECUTIVE".equals(seniority)
                                || "MANAGER".equals(seniority)
                                || "SENIOR".equals(seniority)
                                || "JUNIOR".equals(seniority);
        }

        private String normalizeWebsite(
                        String website) {

                String value = website.trim();

                if (!value.startsWith("http://")
                                && !value.startsWith("https://")) {

                        value = "https://" + value;
                }

                while (value.endsWith("/")) {

                        value = value.substring(
                                        0,
                                        value.length() - 1);
                }

                return value;
        }

        private String extractDomain(
                        String website) {

                try {

                        URI uri = URI.create(website);

                        String host = uri.getHost();

                        if (host == null ||
                                        host.isBlank()) {

                                return website;
                        }

                        host = host.toLowerCase(
                                        Locale.ROOT);

                        if (host.startsWith("www.")) {

                                host = host.substring(4);
                        }

                        return host;

                } catch (Exception e) {

                        return website;
                }
        }

        private String deriveCompanyName(
                        String domain) {

                if (domain == null ||
                                domain.isBlank()) {

                        return "Unknown Company";
                }

                String value = domain;

                String[] parts = value.split("\\.");

                if (parts.length == 0) {

                        return value;
                }

                String name = parts[0]
                                .replace("-", " ")
                                .replace("_", " ")
                                .trim();

                if (name.isBlank()) {

                        return value;
                }

                return capitalizeWords(name);
        }

        private String capitalizeWords(
                        String value) {

                String[] words = value.split("\\s+");

                StringBuilder result = new StringBuilder();

                for (String word : words) {

                        if (word.isBlank()) {
                                continue;
                        }

                        if (result.length() > 0) {
                                result.append(" ");
                        }

                        result.append(
                                        Character.toUpperCase(
                                                        word.charAt(0)));

                        if (word.length() > 1) {

                                result.append(
                                                word.substring(1)
                                                                .toLowerCase(Locale.ROOT));
                        }
                }

                return result.toString();
        }

        private String extractFirstName(
                        String fullName) {

                String[] parts = fullName.trim()
                                .split("\\s+");

                return parts.length > 0
                                ? parts[0]
                                : fullName;
        }

        private String extractLastName(
                        String fullName) {

                String[] parts = fullName.trim()
                                .split("\\s+");

                if (parts.length <= 1) {

                        return null;
                }

                return parts[parts.length - 1];
        }

        private String deriveSeniority(
                        String jobTitle) {

                if (jobTitle == null ||
                                jobTitle.isBlank()) {

                        return null;
                }

                String title = jobTitle.toLowerCase(
                                Locale.ROOT);

                if (title.contains("chief")
                                || title.contains("ceo")
                                || title.contains("cto")
                                || title.contains("cfo")
                                || title.contains("coo")
                                || title.contains("founder")
                                || title.contains("owner")
                                || title.contains("president")) {

                        return "EXECUTIVE";
                }

                if (title.contains("director")
                                || title.contains("vice president")
                                || title.contains("vp")
                                || title.contains("head")
                                || title.contains("manager")
                                || title.contains("lead")) {

                        return "MANAGER";
                }

                if (title.contains("senior")
                                || title.contains("sr.")) {

                        return "SENIOR";
                }

                if (title.contains("junior")
                                || title.contains("jr.")) {

                        return "JUNIOR";
                }

                return null;
        }

        private int calculateQualityScore(EmployeeLead lead) {
                if (lead == null) return 0;
                int score = 0;
                if (lead.getFullName() != null && !lead.getFullName().isBlank()) score += 15;
                if (lead.getJobTitle() != null && !lead.getJobTitle().isBlank()) score += 15;
                if (lead.getCompanyName() != null && !lead.getCompanyName().isBlank()) score += 15;
                if (lead.getCompanyDomain() != null && !lead.getCompanyDomain().isBlank()) score += 10;
                if (Boolean.TRUE.equals(lead.getIsDecisionMaker())) score += 15;
                if (lead.getWorkEmail() != null && !lead.getWorkEmail().isBlank()) score += 15;
                if ("VALID".equalsIgnoreCase(lead.getEmailStatus())) {
                        score += 15;
                } else if ("UNKNOWN".equalsIgnoreCase(lead.getEmailStatus())) {
                        score += 5;
                }
                return Math.min(score, 100);
        }

        public EmployeeLeadResponse toResponse(
                        EmployeeLead lead) {

                return new EmployeeLeadResponse(

                                lead.getId(),

                                lead.getFullName(),
                                lead.getFirstName(),
                                lead.getLastName(),
                                lead.getJobTitle(),
                                lead.getDepartment(),
                                lead.getSeniority(),
                                lead.getProfessionalUrl(),

                                lead.getCompanyName(),
                                lead.getCompanyWebsite(),
                                lead.getCompanyDomain(),
                                lead.getIndustry(),

                                lead.getAddress(),
                                lead.getCity(),
                                lead.getState(),
                                lead.getCountry(),

                                lead.getWorkEmail(),
                                lead.getPhone(),

                                lead.getEmailStatus(),
                                lead.getEmailVerificationConfidence(),
                                lead.getEmailVerifiedAt(),

                                lead.getSource(),
                                lead.getSourceUrl(),
                                lead.getConfidence(),

                                lead.getIsDecisionMaker(),

                                lead.getStatus(),

                                calculateQualityScore(lead),

                                lead.getLastDiscoveredAt(),
                                lead.getDiscoverySource(),

                                lead.getCreatedAt(),
                                lead.getUpdatedAt());
        }

        @Transactional
        public List<EmployeeEmailCandidate> generateEmailCandidates(
                        UUID ownerId,
                        UUID leadId) {

                EmployeeLead lead = employeeLeadRepository
                                .findById(leadId)
                                .orElseThrow(
                                                () -> new IllegalArgumentException(
                                                                "Employee lead not found"));

                verifyOwnership(ownerId, lead);

                if (lead.getWorkEmail() != null && !lead.getWorkEmail().isBlank()) {
                        return List.of(new EmployeeEmailCandidate(
                                        lead.getWorkEmail(),
                                        "Published on source page",
                                        1.0));
                }

                if (lead.getSourceUrl() != null && !lead.getSourceUrl().isBlank()) {
                        try {
                                org.jsoup.nodes.Document doc = org.jsoup.Jsoup.connect(lead.getSourceUrl())
                                                .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                                                .timeout(8000)
                                                .get();
                                String found = employeeDiscoveryService.findPublishedEmailForEmployee(doc, lead.getFullName());
                                if (found != null && !found.isBlank()) {
                                        lead.setWorkEmail(found);
                                        employeeLeadRepository.save(lead);
                                        return List.of(new EmployeeEmailCandidate(found, "Published on source page", 1.0));
                                }
                        } catch (Exception ignored) {
                        }
                }

                return List.of();
        }


}
