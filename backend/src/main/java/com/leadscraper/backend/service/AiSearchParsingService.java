package com.leadscraper.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.leadscraper.backend.dto.lead.SearchFilterRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiSearchParsingService {

    private final Client client;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String modelName;

    public AiSearchParsingService(
            @Value("${GEMINI_API_KEY:}") String apiKey,
            @Value("${gemini.model:gemini-3.6-flash}") String modelName) {

        this.client = Client.builder()
                .apiKey(apiKey)
                .build();

        this.modelName = modelName;
    }

    public SearchFilterRequest parseNaturalLanguageQuery(String userPrompt) {

        if (userPrompt == null || userPrompt.isBlank()) {
            return new SearchFilterRequest(
                    null, null, null, null, null,
                    null, null, null, null, null,
                    null, null, null, null, null,
                    null, null, null, null, null,
                    null, "newest", 0, 20);
        }

        String prompt = """
                You are a Lead Finder search query intelligence system.
                Convert the following natural language user request into structured B2B lead search criteria.

                Extract filters ONLY when they are explicitly mentioned or clearly specified by the user.

                IMPORTANT RULES:
                - Do NOT infer isDecisionMaker just because someone has a senior title.
                - Set isDecisionMaker=true ONLY when the user explicitly asks for decision makers, decision-making people, executives who make decisions, founders, or a similar explicit intent.
                - Otherwise set isDecisionMaker=null.
                - Do NOT put the natural-language sentence into any structured filter.
                - jobTitle should contain only the actual requested job title.
                - department should only be set when explicitly stated or clearly represented by the requested role.
                - seniority may be inferred from an explicitly requested title when appropriate.
                - Location should be converted into city/state/country where reasonably clear.
                - Employee ranges such as "more than 100" should become minEmployees=101.
                - Leave unspecified fields as null.

                Extract:
                - jobTitle (e.g. "CTO", "Marketing Manager", "VP Engineering")
                - department (e.g. "Engineering", "Marketing", "Sales")
                - seniority (e.g. "EXECUTIVE", "MANAGER", "SENIOR", "JUNIOR")
                - industry (e.g. "SaaS", "Fintech", "Technology", "Healthcare")
                - companyName
                - companySize
                - minEmployees
                - maxEmployees
                - revenue
                - funding
                - technology
                - city
                - state
                - country
                - isDecisionMaker

                User Request:
                "%s"

                Return ONLY valid JSON in this exact structure:
                {
                  "jobTitle": null,
                  "department": null,
                  "seniority": null,
                  "industry": null,
                  "companyName": null,
                  "companySize": null,
                  "minEmployees": null,
                  "maxEmployees": null,
                  "revenue": null,
                  "funding": null,
                  "technology": null,
                  "city": null,
                  "state": null,
                  "country": null,
                  "isDecisionMaker": null
                }
                """
                .formatted(userPrompt.trim());

        try {

            GenerateContentResponse response = client.models.generateContent(
                    modelName,
                    prompt,
                    null);

            String resultText = response.text();

            if (resultText == null || resultText.isBlank()) {
                return fallbackFilter(userPrompt);
            }

            String json = cleanJson(resultText);
            JsonNode node = objectMapper.readTree(json);

            String jobTitle = textOrNull(node, "jobTitle");
            String department = textOrNull(node, "department");

            if (department != null
                    && !userPrompt.toLowerCase().contains("department")
                    && !userPrompt.toLowerCase().contains("engineering")
                    && !userPrompt.toLowerCase().contains("marketing")
                    && !userPrompt.toLowerCase().contains("sales")
                    && !userPrompt.toLowerCase().contains("finance")
                    && !userPrompt.toLowerCase().contains("hr")
                    && !userPrompt.toLowerCase().contains("human resources")
                    && !userPrompt.toLowerCase().contains("operations")
                    && !userPrompt.toLowerCase().contains("product")) {

                department = null;
            }
            String seniority = textOrNull(node, "seniority");
            String industry = textOrNull(node, "industry");
            String companyName = textOrNull(node, "companyName");
            String companySize = textOrNull(node, "companySize");

            Integer minEmployees = node.hasNonNull("minEmployees")
                    ? node.get("minEmployees").asInt()
                    : null;

            Integer maxEmployees = node.hasNonNull("maxEmployees")
                    ? node.get("maxEmployees").asInt()
                    : null;

            String revenue = textOrNull(node, "revenue");
            String funding = textOrNull(node, "funding");
            String technology = textOrNull(node, "technology");
            String city = textOrNull(node, "city");
            String state = textOrNull(node, "state");
            String country = textOrNull(node, "country");

            Boolean isDecisionMaker = node.hasNonNull("isDecisionMaker")
                    ? node.get("isDecisionMaker").asBoolean()
                    : null;

            /*
             * The natural-language prompt must NOT be used as the generic
             * query filter. Structured AI filters are already being returned.
             *
             * Otherwise:
             * "Find CTOs"
             * would become query="Find CTOs"
             * and the normal search engine would try to find that exact
             * phrase inside name/title/company/industry.
             */
            String searchQuery = null;

            return new SearchFilterRequest(
                    searchQuery,
                    jobTitle,
                    department,
                    seniority,
                    null,
                    companyName,
                    null,
                    industry,
                    companySize,
                    minEmployees,
                    maxEmployees,
                    revenue,
                    funding,
                    technology,
                    city,
                    state,
                    country,
                    null,
                    null,
                    isDecisionMaker,
                    null,
                    "newest",
                    0,
                    20);

        } catch (Exception e) {

            if (isQuotaError(e)) {
                throw new ResponseStatusException(
                        HttpStatus.TOO_MANY_REQUESTS,
                        "AI search parsing is temporarily unavailable because Gemini quota limit was reached. Please use manual filter controls.",
                        e);
            }

            System.err.println(
                    "[AI SEARCH] AI prompt parsing failed: "
                            + e.getMessage());

            return fallbackFilter(userPrompt);
        }
    }

    private SearchFilterRequest fallbackFilter(String prompt) {

        return new SearchFilterRequest(
                prompt,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "newest",
                0,
                20);
    }

    private String textOrNull(JsonNode node, String fieldName) {

        if (node.has(fieldName)
                && !node.get(fieldName).isNull()) {

            String value = node.get(fieldName).asText();

            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }

        return null;
    }

    private String cleanJson(String text) {

        String cleaned = text.trim();

        if (cleaned.startsWith("```")) {

            int firstNewline = cleaned.indexOf('\n');

            if (firstNewline >= 0) {
                cleaned = cleaned.substring(firstNewline + 1);
            }

            int closingFence = cleaned.lastIndexOf("```");

            if (closingFence >= 0) {
                cleaned = cleaned.substring(0, closingFence);
            }
        }

        return cleaned.trim();
    }

    private boolean isQuotaError(Exception e) {

        String message = e.getMessage();

        if (message == null) {
            return false;
        }

        String lower = message.toLowerCase();

        return lower.contains("quota")
                || lower.contains("resource exhausted")
                || lower.contains("rate limit")
                || lower.contains("429");
    }
}