package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.employee.CreateEmployeeLeadRequest;
import com.leadscraper.backend.dto.employee.DiscoveredEmployee;
import com.leadscraper.backend.dto.employee.EmployeeEmailCandidate;
import com.leadscraper.backend.dto.employee.EmployeeLeadResponse;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.service.EmployeeDiscoveryService;
import com.leadscraper.backend.service.EmployeeLeadService;
import com.leadscraper.backend.dto.employee.EmployeeEmailCandidate;
import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/employee-leads")
public class EmployeeLeadController {

        private static final int MAX_CACHE_ENTRIES = 500;

        private final EmployeeLeadService employeeLeadService;
        private final UserRepository userRepository;
        private final EmployeeDiscoveryService employeeDiscoveryService;

        /*
         * Successful employee discoveries are cached in memory so the same
         * company does not trigger another AI request during this backend run.
         *
         * Important:
         * - Empty results are NOT cached.
         * - Cache is lost when the backend restarts.
         * - This is an early performance/quota-saving layer; persistent caching
         * can be added later with PostgreSQL/Redis.
         */
        private final Map<String, List<DiscoveredEmployee>> discoveryCache = new ConcurrentHashMap<>();

        public EmployeeLeadController(
                        EmployeeLeadService employeeLeadService,
                        UserRepository userRepository,
                        EmployeeDiscoveryService employeeDiscoveryService) {

                this.employeeLeadService = employeeLeadService;
                this.userRepository = userRepository;
                this.employeeDiscoveryService = employeeDiscoveryService;
        }

        /*
         * ============================================================
         * CREATE LEAD
         * ============================================================
         */

        @PostMapping
        public ResponseEntity<EmployeeLeadResponse> createLead(
                        Authentication authentication,
                        @Valid @RequestBody CreateEmployeeLeadRequest request) {

                UUID userId = getAuthenticatedUserId(authentication);

                EmployeeLeadResponse response = employeeLeadService.createLead(
                                userId,
                                request);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(response);
        }

        /*
         * ============================================================
         * GET / SEARCH / FILTER / SORT / PAGINATION
         * ============================================================
         */

        @GetMapping
        public ResponseEntity<Page<EmployeeLeadResponse>> getMyLeads(
                        Authentication authentication,

                        @RequestParam(required = false) String search,

                        @RequestParam(required = false) String company,

                        @RequestParam(required = false) Boolean decisionMaker,

                        @RequestParam(required = false) String status,

                        @RequestParam(required = false) String emailStatus,

                        @RequestParam(required = false) String seniority,

                        @RequestParam(required = false) String department,

                        @RequestParam(required = false) String industry,

                        @RequestParam(required = false) String city,

                        @RequestParam(required = false) String state,

                        @RequestParam(required = false) String country,

                        @RequestParam(required = false) String sort,

                        @RequestParam(defaultValue = "0") int page,

                        @RequestParam(defaultValue = "20") int size) {

                UUID userId = getAuthenticatedUserId(authentication);

                return ResponseEntity.ok(
                                employeeLeadService.getMyLeads(
                                                userId,
                                                search,
                                                company,
                                                decisionMaker,
                                                status,
                                                emailStatus,
                                                seniority,
                                                department,
                                                industry,
                                                city,
                                                state,
                                                country,
                                                sort,
                                                page,
                                                size));
        }

        /*
         * ============================================================
         * AI DISCOVERY
         * ============================================================
         */

        @PostMapping("/discover/save")
        public ResponseEntity<EmployeeLeadResponse> saveDiscoveredEmployee(
                        Authentication authentication,
                        @RequestParam(required = false) String website,
                        @RequestBody DiscoveredEmployee employee) {

                UUID userId = getAuthenticatedUserId(authentication);

                String targetWebsite = (website != null && !website.isBlank())
                                ? website
                                : (employee != null ? employee.companyWebsite() : null);

                EmployeeLeadResponse response = employeeLeadService.saveDiscoveredEmployee(
                                userId,
                                targetWebsite,
                                employee);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(response);
        }

        @PostMapping("/discover/save-batch")
        public ResponseEntity<List<EmployeeLeadResponse>> saveDiscoveredEmployeesBatch(
                        Authentication authentication,
                        @RequestParam(required = false) String website,
                        @RequestBody List<DiscoveredEmployee> employees) {

                UUID userId = getAuthenticatedUserId(authentication);

                List<EmployeeLeadResponse> response = employeeLeadService.saveDiscoveredEmployeesBatch(
                                userId,
                                website,
                                employees);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(response);
        }

        @GetMapping("/discover")
        public ResponseEntity<List<DiscoveredEmployee>> discoverEmployees(
                        Authentication authentication,
                        @RequestParam String website,
                        @RequestParam(defaultValue = "20") int maxEmployees)
                        throws Exception {

                UUID userId = getAuthenticatedUserId(authentication);

                /*
                 * Basic validation.
                 */
                if (website == null || website.isBlank()) {
                        return ResponseEntity.badRequest().build();
                }

                if (maxEmployees < 1 || maxEmployees > 100) {
                        return ResponseEntity.badRequest().build();
                }

                /*
                 * Normalize the website so that:
                 *
                 * https://example.com/
                 * https://www.example.com
                 * example.com
                 *
                 * all resolve to the same company domain.
                 */
                String normalizedWebsite = website.trim();

                if (!normalizedWebsite.startsWith("http://")
                                && !normalizedWebsite.startsWith("https://")) {

                        normalizedWebsite = "https://" + normalizedWebsite;
                }

                while (normalizedWebsite.endsWith("/")) {
                        normalizedWebsite = normalizedWebsite.substring(
                                        0,
                                        normalizedWebsite.length() - 1);
                }

                /*
                 * Extract company domain.
                 */
                String companyDomain;

                try {

                        URI uri = URI.create(normalizedWebsite);

                        companyDomain = uri.getHost();

                        if (companyDomain == null
                                        || companyDomain.isBlank()) {

                                return ResponseEntity.badRequest().build();
                        }

                        companyDomain = companyDomain
                                        .toLowerCase(Locale.ROOT);

                        if (companyDomain.startsWith("www.")) {
                                companyDomain = companyDomain.substring(4);
                        }

                } catch (Exception e) {

                        return ResponseEntity.badRequest().build();
                }

                /*
                 * ============================================================
                 * PERSISTENT DATABASE CACHE
                 * ============================================================
                 *
                 * If this company was discovered within the last 24 hours,
                 * DO NOT:
                 *
                 * - fetch the website
                 * - call Gemini
                 * - run employee discovery again
                 *
                 * Instead return the employees already stored in PostgreSQL.
                 */
                boolean fresh = employeeLeadService.hasFreshDiscovery(
                                userId,
                                companyDomain,
                                24);

                if (fresh) {

                        List<DiscoveredEmployee> cachedEmployees = employeeLeadService.getCachedDiscoveredEmployees(
                                        userId,
                                        companyDomain,
                                        maxEmployees);

                        if (!cachedEmployees.isEmpty()) {

                                System.out.println(
                                                "[CACHE] Persistent discovery hit: "
                                                                + companyDomain);

                                return ResponseEntity.ok(
                                                cachedEmployees);
                        }
                }

                /*
                 * ============================================================
                 * MEMORY CACHE
                 * ============================================================
                 *
                 * This is still useful for discoveries that have not yet been
                 * persisted as leads.
                 */
                String cacheKey = normalizeWebsiteForCache(
                                normalizedWebsite);

                List<DiscoveredEmployee> memoryCached = discoveryCache.get(cacheKey);

                if (memoryCached != null
                                && !memoryCached.isEmpty()) {

                        System.out.println(
                                        "[CACHE] Memory discovery hit: "
                                                        + cacheKey);

                        return ResponseEntity.ok(
                                        limitEmployees(
                                                        memoryCached,
                                                        maxEmployees));
                }

                System.out.println(
                                "[CACHE] Discovery miss: "
                                                + companyDomain);

                /*
                 * ============================================================
                 * ACTUAL WEBSITE + AI DISCOVERY
                 * ============================================================
                 */
                List<DiscoveredEmployee> discovered = employeeDiscoveryService.discoverEmployees(
                                normalizedWebsite,
                                maxEmployees);

                /*
                 * Never cache an empty discovery result.
                 */
                if (discovered != null
                                && !discovered.isEmpty()) {

                        putInCache(
                                        cacheKey,
                                        new ArrayList<>(discovered));
                }

                return ResponseEntity.ok(
                                discovered == null
                                                ? List.of()
                                                : discovered);
        }
        /*
         * ============================================================
         * SINGLE LEAD DELETE
         * ============================================================
         */

        @DeleteMapping("/{leadId}")
        public ResponseEntity<Void> deleteLead(
                        Authentication authentication,
                        @PathVariable UUID leadId) {

                UUID userId = getAuthenticatedUserId(authentication);

                employeeLeadService.deleteLead(
                                userId,
                                leadId);

                return ResponseEntity
                                .noContent()
                                .build();
        }

        /*
         * ============================================================
         * SINGLE LEAD STATUS UPDATE
         * ============================================================
         */

        @PatchMapping("/{leadId}/status")
        public ResponseEntity<EmployeeLeadResponse> updateStatus(
                        Authentication authentication,
                        @PathVariable UUID leadId,
                        @RequestParam String status) {

                UUID userId = getAuthenticatedUserId(authentication);

                return ResponseEntity.ok(
                                employeeLeadService.updateStatus(
                                                userId,
                                                leadId,
                                                status));
        }

        /*
         * ============================================================
         * SINGLE LEAD EMAIL STATUS UPDATE
         * ============================================================
         */

        @PatchMapping("/{leadId}/email-status")
        public ResponseEntity<EmployeeLeadResponse> updateEmailStatus(
                        Authentication authentication,
                        @PathVariable UUID leadId,
                        @RequestParam String emailStatus,
                        @RequestParam(required = false) Double confidence) {

                UUID userId = getAuthenticatedUserId(authentication);

                return ResponseEntity.ok(
                                employeeLeadService.updateEmailStatus(
                                                userId,
                                                leadId,
                                                emailStatus,
                                                confidence));
        }

        /*
         * ============================================================
         * BULK DELETE
         * ============================================================
         *
         * Request body:
         *
         * [
         * "uuid-1",
         * "uuid-2",
         * "uuid-3"
         * ]
         */

        @DeleteMapping("/bulk")
        public ResponseEntity<Map<String, Object>> bulkDeleteLeads(
                        Authentication authentication,
                        @RequestBody List<UUID> leadIds) {

                UUID userId = getAuthenticatedUserId(authentication);

                int deletedCount = employeeLeadService.bulkDeleteLeads(
                                userId,
                                leadIds);

                return ResponseEntity.ok(
                                Map.of(
                                                "deletedCount",
                                                deletedCount));
        }

        /*
         * ============================================================
         * BULK STATUS UPDATE
         * ============================================================
         *
         * Request body:
         *
         * {
         * "leadIds": [
         * "uuid-1",
         * "uuid-2"
         * ],
         * "status": "CONTACTED"
         * }
         */

        @PatchMapping("/bulk/status")
        public ResponseEntity<Map<String, Object>> bulkUpdateStatus(
                        Authentication authentication,
                        @RequestBody BulkStatusUpdateRequest request) {

                UUID userId = getAuthenticatedUserId(authentication);

                int updatedCount = employeeLeadService.bulkUpdateStatus(
                                userId,
                                request.leadIds(),
                                request.status());

                return ResponseEntity.ok(
                                Map.of(
                                                "updatedCount",
                                                updatedCount,
                                                "status",
                                                request.status()
                                                                .trim()
                                                                .toUpperCase()));
        }

        /*
         * ============================================================
         * BULK EMAIL STATUS UPDATE
         * ============================================================
         *
         * Request body:
         *
         * {
         * "leadIds": [
         * "uuid-1",
         * "uuid-2"
         * ],
         * "emailStatus": "VALID",
         * "verificationConfidence": 0.98
         * }
         */

        @PatchMapping("/bulk/email-status")
        public ResponseEntity<Map<String, Object>> bulkUpdateEmailStatus(
                        Authentication authentication,
                        @RequestBody BulkEmailStatusUpdateRequest request) {

                UUID userId = getAuthenticatedUserId(authentication);

                int updatedCount = employeeLeadService.bulkUpdateEmailStatus(
                                userId,
                                request.leadIds(),
                                request.emailStatus(),
                                request.verificationConfidence());

                return ResponseEntity.ok(
                                Map.of(
                                                "updatedCount",
                                                updatedCount,
                                                "emailStatus",
                                                request.emailStatus()
                                                                .trim()
                                                                .toUpperCase()));
        }

        /*
         * ============================================================
         * REQUEST RECORDS FOR BULK OPERATIONS
         * ============================================================
         */

        public record BulkStatusUpdateRequest(
                        List<UUID> leadIds,
                        String status) {
        }

        public record BulkEmailStatusUpdateRequest(
                        List<UUID> leadIds,
                        String emailStatus,
                        Double verificationConfidence) {
        }

        /*
         * ============================================================
         * AUTHENTICATION
         * ============================================================
         */

        private UUID getAuthenticatedUserId(
                        Authentication authentication) {

                String email = authentication.getName();

                User user = userRepository
                                .findByEmail(email)
                                .orElseThrow(
                                                () -> new IllegalStateException(
                                                                "Authenticated user no longer exists"));

                return user.getId();
        }

        /*
         * ============================================================
         * DISCOVERY CACHE
         * ============================================================
         */

        private String normalizeWebsiteForCache(
                        String website) {

                if (website == null ||
                                website.isBlank()) {

                        throw new IllegalArgumentException(
                                        "Company website is required");
                }

                String normalized = website.trim();

                if (!normalized.startsWith("http://") &&
                                !normalized.startsWith("https://")) {

                        normalized = "https://" + normalized;
                }

                try {

                        URI uri = URI.create(normalized);

                        String scheme = uri.getScheme() == null
                                        ? "https"
                                        : uri.getScheme()
                                                        .toLowerCase();

                        String host = uri.getHost();

                        if (host == null ||
                                        host.isBlank()) {

                                return normalized
                                                .replaceAll(
                                                                "/+$",
                                                                "")
                                                .toLowerCase();
                        }

                        return scheme
                                        + "://"
                                        + host
                                                        .toLowerCase()
                                                        .replaceFirst(
                                                                        "^www\\.",
                                                                        "")
                                                        .replaceAll(
                                                                        "/+$",
                                                                        "");

                } catch (Exception ignored) {

                        return normalized
                                        .replaceAll(
                                                        "/+$",
                                                        "")
                                        .toLowerCase();
                }
        }

        private String extractDomainForDiscoveryCache(
                        String website) {

                try {

                        String normalized = normalizeWebsiteForCache(
                                        website);

                        String value = normalized
                                        .toLowerCase(Locale.ROOT)
                                        .trim();

                        if (value.startsWith("http://")) {
                                value = value.substring(7);
                        }

                        if (value.startsWith("https://")) {
                                value = value.substring(8);
                        }

                        int slashIndex = value.indexOf('/');

                        if (slashIndex >= 0) {
                                value = value.substring(
                                                0,
                                                slashIndex);
                        }

                        int queryIndex = value.indexOf('?');

                        if (queryIndex >= 0) {
                                value = value.substring(
                                                0,
                                                queryIndex);
                        }

                        int hashIndex = value.indexOf('#');

                        if (hashIndex >= 0) {
                                value = value.substring(
                                                0,
                                                hashIndex);
                        }

                        if (value.startsWith("www.")) {
                                value = value.substring(4);
                        }

                        return value.trim();

                } catch (Exception e) {

                        return "";
                }
        }

        private void putInCache(
                        String key,
                        List<DiscoveredEmployee> employees) {

                /*
                 * Simple bounded cache.
                 */
                if (discoveryCache.size() >= MAX_CACHE_ENTRIES) {

                        String firstKey = discoveryCache.keySet()
                                        .stream()
                                        .findFirst()
                                        .orElse(null);

                        if (firstKey != null) {

                                discoveryCache.remove(
                                                firstKey);
                        }
                }

                discoveryCache.put(
                                key,
                                List.copyOf(employees));

                System.out.println(
                                "[CACHE] Stored employee discovery: "
                                                + key
                                                + " ("
                                                + employees.size()
                                                + " employees)");
        }

        private List<DiscoveredEmployee> limitEmployees(
                        List<DiscoveredEmployee> employees,
                        int maxEmployees) {

                int safeMax = Math.max(
                                1,
                                Math.min(
                                                maxEmployees,
                                                100));

                if (employees.size() <= safeMax) {

                        return employees;
                }

                return employees.subList(
                                0,
                                safeMax);
        }

        @GetMapping("/{leadId}/email-candidates")
        public ResponseEntity<List<EmployeeEmailCandidate>> generateEmailCandidates(
                        Authentication authentication,
                        @PathVariable UUID leadId) {

                UUID userId = getAuthenticatedUserId(authentication);

                List<EmployeeEmailCandidate> candidates = employeeLeadService.generateEmailCandidates(
                                userId,
                                leadId);

                return ResponseEntity.ok(candidates);
        }

        @PostMapping("/{leadId}/verify-email")
        public ResponseEntity<EmployeeLeadResponse> verifyEmail(
                        Authentication authentication,
                        @PathVariable UUID leadId,
                        @RequestParam String email) {

                UUID userId = getAuthenticatedUserId(authentication);

                EmployeeLeadResponse response = employeeLeadService.verifyEmail(
                                userId,
                                leadId,
                                email);

                return ResponseEntity.ok(response);
        }
}