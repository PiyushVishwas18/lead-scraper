package com.leadscraper.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leadscraper.backend.dto.employee.DiscoveredEmployee;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.*;

@Service
public class EmployeeDiscoveryService {

    private final AiEmployeeExtractionService aiEmployeeExtractionService;
    private final ObjectMapper objectMapper;

    public EmployeeDiscoveryService(
            AiEmployeeExtractionService aiEmployeeExtractionService) {

        this.aiEmployeeExtractionService = aiEmployeeExtractionService;
        this.objectMapper = new ObjectMapper();
    }

    public List<DiscoveredEmployee> discoverEmployees(
            String website,
            int maxEmployees) {

        if (website == null ||
                website.isBlank() ||
                maxEmployees <= 0) {

            return List.of();
        }

        String normalizedWebsite = normalizeWebsite(website);

        Document homepage = fetchPage(normalizedWebsite);

        if (homepage == null) {
            return List.of();
        }

        /*
         * Collect internal links only.
         * No hard-coded page names.
         */
        String linksText = collectInternalLinks(homepage);

        if (linksText.isBlank()) {
            return List.of();
        }

        /*
         * Ask Gemini for the ONE best candidate.
         */
        String pageResult;

        try {

            pageResult = aiEmployeeExtractionService
                    .discoverEmployeePages(
                            normalizedWebsite,
                            linksText);

        } catch (Exception e) {

            if (isAiQuotaOrRateLimitError(e)) {
                throw aiUnavailable(e);
            }

            System.err.println(
                    "[AI] Page discovery failed: "
                            + e.getMessage());

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI employee-page discovery failed",
                    e);
        }

        String employeePage = parseEmployeePage(
                pageResult,
                normalizedWebsite);

        if (employeePage == null ||
                employeePage.isBlank()) {

            return List.of();
        }

        /*
         * Fetch only ONE page initially.
         */
        Document employeeDocument = fetchPage(employeePage);

        if (employeeDocument == null) {
            return List.of();
        }

        try {

            /*
             * STEP 1:
             * Extract employees from the page.
             */
            String aiResult = aiEmployeeExtractionService
                    .extractEmployees(
                            employeeDocument.html(),
                            employeePage,
                            maxEmployees);

            List<DiscoveredEmployee> employees = parseEmployees(
                    aiResult,
                    maxEmployees);

            if (employees.isEmpty()) {
                return employees;
            }

            /*
             * STEP 1.5:
             * Extract real published emails from the scraped page HTML/DOM.
             */
            employees = enrichWithSourceEmails(employeeDocument, employees);

            /*
             * STEP 2:
             * Serialize the complete employee batch.
             *
             * We make ONE Gemini request for the entire batch,
             * rather than one request per employee.
             */
            String employeesJson = objectMapper.writeValueAsString(employees);

            String classificationResult = aiEmployeeExtractionService
                    .classifyDecisionMakers(
                            employeesJson);

            /*
             * STEP 3:
             * Apply the AI classification back onto
             * the discovered employee records.
             */
            return applyDecisionMakerClassification(
                    employees,
                    classificationResult);

        } catch (Exception e) {

            if (isAiQuotaOrRateLimitError(e)) {
                throw aiUnavailable(e);
            }

            if (e instanceof ResponseStatusException responseStatusException) {
                throw responseStatusException;
            }

            System.err.println(
                    "[AI] Employee discovery pipeline failed: "
                            + e.getMessage());

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "AI employee discovery failed",
                    e);
        }
    }

    private ResponseStatusException aiUnavailable(
            Exception cause) {

        return new ResponseStatusException(
                HttpStatus.TOO_MANY_REQUESTS,
                "AI employee discovery is temporarily unavailable because the Gemini quota or rate limit has been exceeded. Please try again later.",
                cause);
    }

    private boolean isAiQuotaOrRateLimitError(
            Throwable error) {

        Throwable current = error;

        while (current != null) {

            String message = current.getMessage();

            if (message != null) {

                String normalized = message.toLowerCase(Locale.ROOT);

                if (normalized.contains("quota")
                        || normalized.contains("resource_exhausted")
                        || normalized.contains("rate limit")
                        || normalized.contains("rate_limit")
                        || normalized.contains("too many requests")
                        || normalized.contains("status code: 429")
                        || normalized.contains("http 429")
                        || normalized.matches(".*\\b429\\b.*")) {

                    return true;
                }
            }

            current = current.getCause();
        }

        return false;
    }

    /**
     * Applies the decision-maker classification returned by Gemini.
     *
     * Matching is performed using normalized full names.
     *
     * If Gemini does not return a classification for a particular
     * employee, isDecisionMaker remains null.
     */
    private List<DiscoveredEmployee> applyDecisionMakerClassification(
            List<DiscoveredEmployee> employees,
            String classificationResult) {

        if (classificationResult == null ||
                classificationResult.isBlank()) {

            return employees;
        }

        try {

            String json = cleanJson(classificationResult);

            JsonNode root = objectMapper.readTree(json);

            JsonNode array = root.get("employees");

            if (array == null ||
                    !array.isArray()) {

                return employees;
            }

            Map<String, Boolean> classificationMap = new HashMap<>();

            for (JsonNode employee : array) {

                String fullName = employee
                        .path("fullName")
                        .asText("");

                if (fullName.isBlank()) {
                    continue;
                }

                JsonNode decisionNode = employee.get("isDecisionMaker");

                if (decisionNode == null ||
                        decisionNode.isNull()) {

                    continue;
                }

                if (!decisionNode.isBoolean()) {
                    continue;
                }

                classificationMap.put(
                        normalizeName(fullName),
                        decisionNode.asBoolean());
            }

            List<DiscoveredEmployee> result = new ArrayList<>();

            for (DiscoveredEmployee employee : employees) {

                Boolean isDecisionMaker = classificationMap.get(
                        normalizeName(
                                employee.fullName()));

                result.add(
                        new DiscoveredEmployee(
                                employee.fullName(),
                                employee.jobTitle(),
                                employee.professionalUrl(),
                                employee.sourceUrl(),
                                employee.email(),
                                employee.companyName(),
                                employee.companyWebsite(),
                                employee.confidence(),
                                isDecisionMaker));
            }

            return result;

        } catch (Exception e) {

            /*
             * Do not throw away valid employee discovery data
             * just because classification JSON was malformed.
             */
            System.err.println(
                    "[AI] Invalid decision-maker classification JSON: "
                            + e.getMessage());

            return employees;
        }
    }

    private static final java.util.regex.Pattern EMAIL_PATTERN = java.util.regex.Pattern.compile(
            "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    private static final Set<String> GENERIC_EMAIL_PREFIXES = Set.of(
            "info", "contact", "support", "sales", "hello", "admin", "help",
            "office", "billing", "jobs", "careers", "media", "press", "inquiries",
            "enquiries", "team", "marketing", "general", "privacy", "legal");

    public List<DiscoveredEmployee> enrichWithSourceEmails(
            Document document,
            List<DiscoveredEmployee> employees) {

        if (document == null || employees == null || employees.isEmpty()) {
            return employees;
        }

        List<DiscoveredEmployee> enriched = new ArrayList<>();

        for (DiscoveredEmployee emp : employees) {
            String foundEmail = findPublishedEmailForEmployee(document, emp.fullName());
            enriched.add(new DiscoveredEmployee(
                    emp.fullName(),
                    emp.jobTitle(),
                    emp.professionalUrl(),
                    emp.sourceUrl(),
                    foundEmail,
                    emp.companyName(),
                    emp.companyWebsite(),
                    emp.confidence(),
                    emp.isDecisionMaker()));
        }

        return enriched;
    }

    public String findPublishedEmailForEmployee(Document document, String fullName) {
        if (document == null || fullName == null || fullName.isBlank()) {
            return null;
        }

        String normalizedName = fullName.toLowerCase(Locale.ROOT).trim();
        String[] nameParts = normalizedName.split("\\s+");
        String firstName = nameParts.length > 0 ? nameParts[0] : "";
        String lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

        Elements elementsWithEmail = document.select("a[href^=mailto:], div, p, li, article, section, td, tr");
        for (Element el : elementsWithEmail) {
            String text = el.text().toLowerCase(Locale.ROOT);
            if (!firstName.isEmpty() && text.contains(firstName) && (!lastName.isEmpty() && text.contains(lastName))) {
                Elements mailtoLinks = el.select("a[href^=mailto:]");
                for (Element mailto : mailtoLinks) {
                    String email = cleanEmail(mailto.attr("href").replaceFirst("(?i)^mailto:", ""));
                    if (isValidEmployeeEmail(email)) {
                        return email;
                    }
                }
                java.util.regex.Matcher matcher = EMAIL_PATTERN.matcher(el.text());
                while (matcher.find()) {
                    String email = cleanEmail(matcher.group());
                    if (isValidEmployeeEmail(email)) {
                        return email;
                    }
                }
            }
        }

        Elements allMailtos = document.select("a[href^=mailto:]");
        for (Element mailto : allMailtos) {
            String email = cleanEmail(mailto.attr("href").replaceFirst("(?i)^mailto:", ""));
            if (isValidEmployeeEmail(email) && emailMatchesName(email, firstName, lastName)) {
                return email;
            }
        }

        java.util.regex.Matcher globalMatcher = EMAIL_PATTERN.matcher(document.text());
        while (globalMatcher.find()) {
            String email = cleanEmail(globalMatcher.group());
            if (isValidEmployeeEmail(email) && emailMatchesName(email, firstName, lastName)) {
                return email;
            }
        }

        return null;
    }

    private boolean isValidEmployeeEmail(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        int atIdx = email.indexOf('@');
        if (atIdx <= 0) {
            return false;
        }
        String localPart = email.substring(0, atIdx).toLowerCase(Locale.ROOT);
        return !GENERIC_EMAIL_PREFIXES.contains(localPart);
    }

    private boolean emailMatchesName(String email, String firstName, String lastName) {
        if (email == null) return false;
        int atIdx = email.indexOf('@');
        if (atIdx <= 0) return false;
        String localPart = email.substring(0, atIdx).toLowerCase(Locale.ROOT);
        if (!firstName.isEmpty() && firstName.length() >= 2 && localPart.contains(firstName)) {
            return true;
        }
        if (!lastName.isEmpty() && lastName.length() >= 2 && localPart.contains(lastName)) {
            return true;
        }
        if (!firstName.isEmpty() && !lastName.isEmpty() && lastName.length() >= 2) {
            String initialAndLast = firstName.substring(0, 1) + lastName;
            if (localPart.contains(initialAndLast)) {
                return true;
            }
        }
        return false;
    }

    private String cleanEmail(String raw) {
        if (raw == null) return "";
        String cleaned = raw.trim();
        int queryIdx = cleaned.indexOf('?');
        if (queryIdx >= 0) {
            cleaned = cleaned.substring(0, queryIdx);
        }
        return cleaned.toLowerCase(Locale.ROOT).trim();
    }

    private String normalizeName(
            String name) {

        if (name == null) {
            return "";
        }

        return name
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    /**
     * Collect useful internal links from homepage.
     * Gemini decides which one contains employees.
     */
    private String collectInternalLinks(
            Document homepage) {

        StringBuilder result = new StringBuilder();

        Set<String> seen = new LinkedHashSet<>();

        Elements links = homepage.select("a[href]");

        for (Element link : links) {

            String href = link.attr("abs:href");

            if (href == null ||
                    href.isBlank()) {

                continue;
            }

            href = removeFragment(href);

            if (!isSameWebsite(
                    homepage.location(),
                    href)) {

                continue;
            }

            if (!seen.add(href)) {
                continue;
            }

            String text = normalizeText(link.text());

            String context = "";

            Element parent = link.parent();

            if (parent != null) {

                context = normalizeText(
                        parent.text());

                if (context.length() > 250) {

                    context = context.substring(
                            0,
                            250);
                }
            }

            result.append(
                    "TEXT: ")
                    .append(text)
                    .append("\n");

            result.append(
                    "URL: ")
                    .append(href)
                    .append("\n");

            if (!context.isBlank()) {

                result.append(
                        "CONTEXT: ")
                        .append(context)
                        .append("\n");
            }

            result.append("\n");

            /*
             * Prevent an extremely large Gemini request.
             */
            if (result.length() >= 25000) {
                break;
            }
        }

        return result.toString();
    }

    private String parseEmployeePage(
            String aiResult,
            String homepageUrl) {

        if (aiResult == null ||
                aiResult.isBlank()) {

            return null;
        }

        try {

            String json = cleanJson(aiResult);

            JsonNode root = objectMapper.readTree(json);

            String url = root.path("url")
                    .asText("");

            if (url.isBlank()) {
                return null;
            }

            if (!isSameWebsite(
                    homepageUrl,
                    url)) {

                return null;
            }

            return removeFragment(url);

        } catch (Exception e) {

            System.err.println(
                    "[AI] Invalid employee-page response: "
                            + e.getMessage());

            return null;
        }
    }

    private List<DiscoveredEmployee> parseEmployees(
            String aiResult,
            int maxEmployees) {

        if (aiResult == null ||
                aiResult.isBlank()) {

            return List.of();
        }

        try {

            String json = cleanJson(aiResult);

            JsonNode root = objectMapper.readTree(json);

            JsonNode array = root.get("employees");

            if (array == null ||
                    !array.isArray()) {

                return List.of();
            }

            Map<String, DiscoveredEmployee> employees = new LinkedHashMap<>();

            for (JsonNode employee : array) {

                if (employees.size() >= maxEmployees) {
                    break;
                }

                String name = employee
                        .path("fullName")
                        .asText("");

                String jobTitle = employee
                        .path("jobTitle")
                        .asText("");

                String professionalUrl = employee
                        .path("professionalUrl")
                        .asText("");

                String sourceUrl = employee
                        .path("sourceUrl")
                        .asText("");

                double confidence = employee
                        .path("confidence")
                        .asDouble(0.0);

                if (name.isBlank() ||
                        jobTitle.isBlank()) {

                    continue;
                }

                if (professionalUrl.isBlank()) {
                    professionalUrl = null;
                }

                if (sourceUrl.isBlank()) {
                    sourceUrl = null;
                }

                String key = normalizeText(name)
                        .toLowerCase();

                if (employees.containsKey(key)) {
                    continue;
                }

                employees.put(
                        key,
                        new DiscoveredEmployee(
                                name.trim(),
                                jobTitle.trim(),
                                professionalUrl,
                                sourceUrl,
                                confidence,
                                null));
            }

            return new ArrayList<>(
                    employees.values());

        } catch (Exception e) {

            System.err.println(
                    "[AI] Invalid employee extraction JSON: "
                            + e.getMessage());

            return List.of();
        }
    }

    private String cleanJson(
            String result) {

        String json = result.trim();

        if (json.startsWith("```")) {

            json = json
                    .replaceFirst(
                            "^```json\\s*",
                            "")
                    .replaceFirst(
                            "^```\\s*",
                            "")
                    .replaceFirst(
                            "\\s*```$",
                            "")
                    .trim();
        }

        return json;
    }

    private Document fetchPage(
            String url) {

        try {

            return Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 " +
                                    "(Windows NT 10.0; Win64; x64) " +
                                    "AppleWebKit/537.36 " +
                                    "Chrome/126.0 Safari/537.36")
                    .timeout(12000)
                    .followRedirects(true)
                    .get();

        } catch (Exception e) {

            return null;
        }
    }

    private boolean isSameWebsite(
            String firstUrl,
            String secondUrl) {

        try {

            URI first = URI.create(firstUrl);

            URI second = URI.create(secondUrl);

            String firstHost = normalizeHost(
                    first.getHost());

            String secondHost = normalizeHost(
                    second.getHost());

            return firstHost.equals(
                    secondHost);

        } catch (Exception e) {

            return false;
        }
    }

    private String normalizeHost(
            String host) {

        if (host == null) {
            return "";
        }

        host = host.toLowerCase();

        if (host.startsWith("www.")) {

            host = host.substring(4);
        }

        return host;
    }

    private String normalizeWebsite(
            String website) {

        String normalized = website.trim();

        if (!normalized.startsWith("http://") &&
                !normalized.startsWith("https://")) {

            normalized = "https://" + normalized;
        }

        while (normalized.endsWith("/")) {

            normalized = normalized.substring(
                    0,
                    normalized.length() - 1);
        }

        return normalized;
    }

    private String removeFragment(
            String url) {

        int index = url.indexOf('#');

        if (index >= 0) {

            return url.substring(
                    0,
                    index);
        }

        return url;
    }

    private String normalizeText(
            String text) {

        if (text == null) {
            return "";
        }

        return text
                .replaceAll("\\s+", " ")
                .trim();
    }
}