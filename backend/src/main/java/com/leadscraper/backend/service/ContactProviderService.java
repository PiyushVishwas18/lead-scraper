package com.leadscraper.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leadscraper.backend.dto.lead.ContactRevealResponse;
import com.leadscraper.backend.entity.EmployeeLead;
import com.leadscraper.backend.repository.EmployeeLeadRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Instant;
import java.util.UUID;

@Service
public class ContactProviderService {

    private static final Logger log = LoggerFactory.getLogger(ContactProviderService.class);

    private final String apiKey;
    private final EmployeeLeadRepository employeeLeadRepository;
    private final CreditAndUsageService creditAndUsageService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ContactProviderService(
            @Value("${contact.provider.api.key:}") String apiKey,
            EmployeeLeadRepository employeeLeadRepository,
            CreditAndUsageService creditAndUsageService) {

        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.employeeLeadRepository = employeeLeadRepository;
        this.creditAndUsageService = creditAndUsageService;

        this.restClient = RestClient.builder()
                .baseUrl("https://api.hunter.io")
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    @Transactional
    public ContactRevealResponse revealContact(UUID ownerId, UUID leadId) {

        log.info("=== HUNTER REVEAL START ===");
        log.info("Lead ID: {}", leadId);

        EmployeeLead lead = employeeLeadRepository.findById(leadId)
                .orElseThrow(() -> new IllegalArgumentException("Employee lead not found"));

        if (!lead.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException(
                    "Unauthorized access to employee lead");
        }

        log.info("Lead found: {}", lead.getFullName());
        log.info("Company: {}", lead.getCompanyName());
        log.info("Company domain: {}", lead.getCompanyDomain());
        log.info("Company website: {}", lead.getCompanyWebsite());

        if (!isConfigured()) {

            log.error("Hunter API key is NOT configured.");

            return response(
                    lead,
                    false,
                    "Hunter contact provider is not configured. " +
                            "Please configure CONTACT_PROVIDER_API_KEY.");
        }

        log.info("Hunter API key is configured.");

        String resolvedDomain = normalizeDomain(lead.getCompanyDomain());

        if (resolvedDomain.isBlank()) {
            resolvedDomain = normalizeDomain(lead.getCompanyWebsite());
        }

        final String domain = resolvedDomain;

        log.info("Resolved Hunter domain: {}", domain);

        if (domain.isBlank()) {

            return response(
                    lead,
                    false,
                    "Company domain is missing. Hunter needs the company domain to find the contact.");
        }

        String firstName = safe(lead.getFirstName());
        String lastName = safe(lead.getLastName());
        String fullName = safe(lead.getFullName());

        log.info("First name: {}", firstName);
        log.info("Last name: {}", lastName);
        log.info("Full name: {}", fullName);

        if (firstName.isBlank()
                && lastName.isBlank()
                && fullName.isBlank()) {

            return response(
                    lead,
                    false,
                    "Contact name is missing. Hunter needs a person's name.");
        }

        /*
         * Hunter needs both first and last name.
         * Do not send a single-word name such as "Saeed".
         */
        if (firstName.isBlank() || lastName.isBlank()) {

            if (fullName.isBlank() || !fullName.contains(" ")) {

                return response(
                        lead,
                        false,
                        "A complete first and last name is required to reveal this contact.");
            }
        }
        int currentCredits = creditAndUsageService
                .getOrCreateUserCredit(ownerId)
                .getRemainingCredits();

        log.info("Application credits before Hunter lookup: {}",
                currentCredits);

        if (currentCredits <= 0) {

            return response(
                    lead,
                    false,
                    "Insufficient credits for contact reveal.");
        }

        try {

            String hunterResponse;

            if (!firstName.isBlank() && !lastName.isBlank()) {

                log.info("Calling Hunter Email Finder using first_name/last_name.");

                log.info(
                        "Hunter request parameters: domain={}, first_name={}, last_name={}",
                        domain,
                        firstName,
                        lastName);

                hunterResponse = restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/v2/email-finder")
                                .queryParam("domain", domain)
                                .queryParam("first_name", firstName)
                                .queryParam("last_name", lastName)
                                .build())
                        .header("X-API-KEY", apiKey)
                        .retrieve()
                        .body(String.class);

            } else {

                /*
                 * If first/last name are incomplete,
                 * use full_name instead.
                 */
                String hunterFullName = !fullName.isBlank()
                        ? fullName
                        : firstName + " " + lastName;

                log.info("Calling Hunter Email Finder using full_name.");

                log.info(
                        "Hunter request parameters: domain={}, full_name={}",
                        domain,
                        hunterFullName);

                hunterResponse = restClient.get()
                        .uri(uriBuilder -> uriBuilder
                                .path("/v2/email-finder")
                                .queryParam("domain", domain)
                                .queryParam("full_name", hunterFullName)
                                .build())
                        .header("X-API-KEY", apiKey)
                        .retrieve()
                        .body(String.class);
            }
            log.info("Hunter request completed successfully.");

            if (hunterResponse == null
                    || hunterResponse.isBlank()) {

                log.error("Hunter returned an EMPTY response.");

                return response(
                        lead,
                        false,
                        "Hunter returned an empty response.");
            }

            /*
             * Diagnostic logging.
             *
             * This logs Hunter's response but NEVER logs the API key.
             */
            log.info("Hunter response received:");
            log.info("{}", hunterResponse);

            JsonNode root = objectMapper.readTree(hunterResponse);

            JsonNode data = root.path("data");

            if (data.isMissingNode()
                    || data.isNull()) {

                log.warn(
                        "Hunter response does not contain usable data.");

                return response(
                        lead,
                        false,
                        "Hunter did not return contact data.");
            }

            String hunterEmail = null;
            Double hunterScore = null;
            String hunterVerificationStatus = null;
            String hunterSourceUrl = null;
            String hunterPhone = null;

            JsonNode emailNode = data.path("email");

            if (!emailNode.isMissingNode()
                    && !emailNode.isNull()) {

                hunterEmail = safe(emailNode.asText());

                log.info("Hunter email returned: {}",
                        hunterEmail);
            }

            JsonNode scoreNode = data.path("score");

            if (!scoreNode.isMissingNode()
                    && !scoreNode.isNull()
                    && scoreNode.isNumber()) {

                hunterScore = scoreNode.asDouble();

                log.info("Hunter score: {}",
                        hunterScore);
            }

            JsonNode verification = data.path("verification");

            if (!verification.isMissingNode()
                    && !verification.isNull()) {

                JsonNode statusNode = verification.path("status");

                if (!statusNode.isMissingNode()
                        && !statusNode.isNull()) {

                    hunterVerificationStatus = safe(statusNode.asText());

                    log.info(
                            "Hunter verification status: {}",
                            hunterVerificationStatus);
                }
            }

            JsonNode sources = data.path("sources");

            if (sources.isArray()
                    && !sources.isEmpty()) {

                log.info(
                        "Hunter returned {} source(s).",
                        sources.size());

                for (JsonNode source : sources) {

                    JsonNode uriNode = source.path("uri");

                    if (!uriNode.isMissingNode()
                            && !uriNode.isNull()) {

                        String uri = safe(uriNode.asText());

                        if (!uri.isBlank()) {

                            hunterSourceUrl = uri;

                            log.info(
                                    "Hunter public source: {}",
                                    hunterSourceUrl);

                            break;
                        }
                    }
                }

            } else {

                log.info(
                        "Hunter returned NO public sources.");
            }

            JsonNode phoneNode = data.path("phone_number");

            if (!phoneNode.isMissingNode()
                    && !phoneNode.isNull()) {

                hunterPhone = safe(phoneNode.asText());

                log.info(
                        "Hunter phone returned: {}",
                        hunterPhone);
            }

            /*
             * Source-first policy:
             * Never accept an email unless Hunter
             * also provides a public source.
             */
            if (hunterEmail == null
                    || hunterEmail.isBlank()) {

                log.warn(
                        "Hunter did not find a professional email.");

                return response(
                        lead,
                        false,
                        "Hunter could not find a professional email for this contact.");
            }

            /*
             * Only charge application credit after
             * receiving a valid source-backed result.
             */
            boolean deducted = creditAndUsageService
                    .deductCredits(ownerId, 1);

            if (!deducted) {

                log.warn(
                        "Hunter returned a valid result, but application credit deduction failed.");

                return response(
                        lead,
                        false,
                        "Insufficient credits for contact reveal.");
            }

            creditAndUsageService.logUsage(
                    ownerId,
                    "CONTACT_REVEALED",
                    1);

            lead.setWorkEmail(hunterEmail);

            if (hunterPhone != null
                    && !hunterPhone.isBlank()) {

                lead.setPhone(hunterPhone);
            }

            if (hunterScore != null) {

                lead.setEmailVerificationConfidence(
                        hunterScore);
            }

            lead.setEmailStatus(
                    mapHunterVerificationStatus(
                            hunterVerificationStatus));

            lead.setEmailVerifiedAt(
                    Instant.now());

            lead.setSource("Hunter");
            lead.setSourceUrl(
                    hunterSourceUrl != null && !hunterSourceUrl.isBlank()
                            ? hunterSourceUrl
                            : null);
            lead.setUpdatedAt(Instant.now());

            employeeLeadRepository.save(lead);

            int remainingCredits = creditAndUsageService
                    .getOrCreateUserCredit(ownerId)
                    .getRemainingCredits();

            log.info(
                    "Hunter reveal SUCCESS. Remaining application credits: {}",
                    remainingCredits);

            log.info("=== HUNTER REVEAL END ===");

            return new ContactRevealResponse(
                    lead.getWorkEmail(),
                    lead.getEmailStatus(),
                    lead.getPhone(),
                    lead.getSource(),
                    lead.getSourceUrl(),
                    true,
                    "Contact revealed successfully using Hunter.",
                    remainingCredits);

        } catch (RestClientResponseException e) {

            int status = e.getStatusCode().value();

            String errorBody = e.getResponseBodyAsString();

            log.error(
                    "=== HUNTER HTTP ERROR ===");

            log.error(
                    "Hunter HTTP status: {}",
                    status);

            log.error(
                    "Hunter response body: {}",
                    errorBody);

            String message;

            if (status == 401 || status == 403) {

                message = "Hunter rejected the API key. " +
                        "Please check CONTACT_PROVIDER_API_KEY.";

            } else if (status == 429) {

                message = "Hunter rate limit or usage limit reached. " +
                        "Please try again later.";

            } else {

                message = "Hunter request failed with HTTP " +
                        status + ".";
            }

            return response(
                    lead,
                    false,
                    message);

        } catch (Exception e) {

            log.error(
                    "=== HUNTER UNEXPECTED ERROR ===",
                    e);

            return response(
                    lead,
                    false,
                    "Hunter contact lookup failed: " +
                            safeExceptionMessage(e));
        }
    }

    private ContactRevealResponse response(
            EmployeeLead lead,
            boolean success,
            String message) {

        int credits = 0;

        if (lead.getOwnerId() != null) {

            credits = creditAndUsageService
                    .getOrCreateUserCredit(
                            lead.getOwnerId())
                    .getRemainingCredits();
        }

        return new ContactRevealResponse(
                lead.getWorkEmail(),
                lead.getEmailStatus(),
                lead.getPhone(),
                lead.getSource(),
                lead.getSourceUrl(),
                success,
                message,
                credits);
    }

    private String safe(String value) {
        return value == null
                ? ""
                : value.trim();
    }

    private String normalizeDomain(String value) {

        if (value == null) {
            return "";
        }

        String domain = value.trim().toLowerCase();

        if (domain.isBlank()) {
            return "";
        }

        domain = domain.replaceFirst(
                "^https?://",
                "");

        domain = domain.replaceFirst(
                "^www\\.",
                "");

        int slashIndex = domain.indexOf('/');

        if (slashIndex >= 0) {
            domain = domain.substring(0, slashIndex);
        }

        int questionIndex = domain.indexOf('?');

        if (questionIndex >= 0) {
            domain = domain.substring(0, questionIndex);
        }

        int hashIndex = domain.indexOf('#');

        if (hashIndex >= 0) {
            domain = domain.substring(0, hashIndex);
        }

        int colonIndex = domain.indexOf(':');

        if (colonIndex >= 0) {
            domain = domain.substring(0, colonIndex);
        }

        return domain.trim();
    }

    private String mapHunterVerificationStatus(
            String hunterStatus) {

        if (hunterStatus == null) {
            return "UNKNOWN";
        }

        return switch (hunterStatus.toLowerCase()) {

            case "valid" ->
                "VALID";

            case "invalid" ->
                "INVALID";

            case "accept_all",
                    "unknown" ->
                "UNKNOWN";

            default ->
                "UNKNOWN";
        };
    }

    private String safeExceptionMessage(Exception e) {

        String message = e.getMessage();

        if (message == null
                || message.isBlank()) {

            return e.getClass()
                    .getSimpleName();
        }

        return message.length() > 250
                ? message.substring(0, 250)
                : message;
    }
}