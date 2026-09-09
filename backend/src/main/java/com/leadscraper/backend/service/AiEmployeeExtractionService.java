package com.leadscraper.backend.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.leadscraper.backend.dto.employee.EmployeeEmailCandidate;

import java.util.ArrayList;
import java.util.List;

@Service
public class AiEmployeeExtractionService {
        private final ObjectMapper objectMapper;
        private final Client client;

        public AiEmployeeExtractionService(
                        @Value("${GEMINI_API_KEY}") String apiKey) {

                this.client = Client.builder()
                                .apiKey(apiKey)
                                .build();

                this.objectMapper = new ObjectMapper();
        }

        public String discoverEmployeePages(
                        String homepageUrl,
                        String linksText) {

                String prompt = """
                                You are a website-navigation intelligence system.

                                Find the SINGLE internal webpage most likely to
                                contain real people working for the company.

                                Analyze:
                                - Link text
                                - URL
                                - Link context

                                IMPORTANT:
                                - Do NOT assume the page is called "team".
                                - Do NOT rely on hard-coded page names.
                                - The page can have any URL or title.
                                - Look for pages containing employees, leadership,
                                  founders, executives, staff, professionals,
                                  directors, managers, advisors, etc.
                                - Do not choose careers, job openings, products,
                                  services, blogs, news, or generic contact pages.
                                - Return only ONE page.
                                - The URL MUST be one of the URLs supplied below.
                                - Do not invent a URL.

                                Return ONLY valid JSON.

                                Format:

                                {
                                  "url": "https://example.com/page",
                                  "reason": "Why this page is likely to contain employees",
                                  "confidence": 0.95
                                }

                                If there is no reasonable candidate:

                                {
                                  "url": "",
                                  "reason": "",
                                  "confidence": 0
                                }

                                Homepage:
                                %s

                                Internal links:
                                %s
                                """.formatted(
                                homepageUrl,
                                linksText == null ? "" : linksText);

                long start = System.currentTimeMillis();

                try {

                        System.out.println(
                                        "[AI] Starting page discovery for: "
                                                        + homepageUrl);

                        GenerateContentResponse response = client.models.generateContent(
                                        "gemini-3.6-flash",
                                        prompt,
                                        null);

                        long elapsed = System.currentTimeMillis() - start;

                        System.out.println(
                                        "[AI] Page discovery completed in "
                                                        + elapsed
                                                        + " ms");

                        return response.text();

                } catch (Exception e) {

                        long elapsed = System.currentTimeMillis() - start;

                        String message = e.getMessage() == null
                                        ? ""
                                        : e.getMessage();

                        if (isQuotaOrRateLimitError(e)) {

                                System.err.println(
                                                "[AI] QUOTA EXCEEDED after "
                                                                + elapsed
                                                                + " ms");

                                /*
                                 * IMPORTANT:
                                 *
                                 * Do NOT return an empty JSON response here.
                                 *
                                 * Returning an empty result makes the rest of the
                                 * application think that the company simply has no
                                 * employee page.
                                 *
                                 * Instead, return HTTP 429 so the frontend/backend
                                 * knows that the AI service is temporarily unavailable.
                                 */
                                throw new ResponseStatusException(
                                                HttpStatus.TOO_MANY_REQUESTS,
                                                "Gemini API quota exceeded. Please try again later.",
                                                e);
                        }

                        System.err.println(
                                        "[AI] Page discovery FAILED after "
                                                        + elapsed
                                                        + " ms");

                        System.err.println(
                                        "[AI] Error: "
                                                        + message);

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "AI page discovery failed",
                                        e);
                }
        }

        public String extractEmployees(
                        String html,
                        String sourceUrl,
                        int maxEmployees) {

                if (html == null
                                || html.isBlank()
                                || maxEmployees <= 0) {

                        return """
                                        {
                                          "employees": []
                                        }
                                        """;
                }

                Document document = Jsoup.parse(html);

                String pageText = document.body() != null
                                ? document.body().text()
                                : document.text();

                if (pageText.length() > 50000) {

                        pageText = pageText.substring(
                                        0,
                                        50000);
                }

                String prompt = """
                                You are an employee-data extraction system.

                                Analyze this webpage and extract ONLY real people
                                clearly associated with the organization.

                                Extract:
                                - Full name
                                - Professional job title
                                - Professional/profile URL if explicitly available

                                Do NOT extract:
                                - Blog posts
                                - Dates
                                - Navigation text
                                - Products
                                - Services
                                - Companies
                                - Events
                                - Generic phrases
                                - Recent Posts
                                - Job vacancies
                                - Job advertisements

                                Do not invent information.

                                Return AT MOST %d employees.

                                Prefer senior decision-makers first.

                                Return ONLY valid JSON:

                                {
                                  "employees": [
                                    {
                                      "fullName": "John Smith",
                                      "jobTitle": "Chief Executive Officer",
                                      "professionalUrl": "",
                                      "sourceUrl": "%s",
                                      "confidence": 0.95
                                    }
                                  ]
                                }

                                If no employees are found:

                                {
                                  "employees": []
                                }

                                Source URL:
                                %s

                                Webpage text:
                                %s
                                """.formatted(
                                maxEmployees,
                                sourceUrl,
                                sourceUrl,
                                pageText);

                long start = System.currentTimeMillis();

                try {

                        System.out.println(
                                        "[AI] Starting employee extraction for: "
                                                        + sourceUrl);

                        System.out.println(
                                        "[AI] Text size: "
                                                        + pageText.length()
                                                        + " characters");

                        GenerateContentResponse response = client.models.generateContent(
                                        "gemini-3.6-flash",
                                        prompt,
                                        null);

                        long elapsed = System.currentTimeMillis() - start;

                        System.out.println(
                                        "[AI] Employee extraction completed in "
                                                        + elapsed
                                                        + " ms");

                        return response.text();

                } catch (Exception e) {

                        long elapsed = System.currentTimeMillis() - start;

                        String message = e.getMessage() == null
                                        ? ""
                                        : e.getMessage();

                        if (isQuotaOrRateLimitError(e)) {

                                System.err.println(
                                                "[AI] QUOTA EXCEEDED during employee extraction after "
                                                                + elapsed
                                                                + " ms");

                                /*
                                 * Do NOT convert quota errors into:
                                 *
                                 * {
                                 * "employees": []
                                 * }
                                 *
                                 * That incorrectly appears as "0 employees".
                                 */
                                throw new ResponseStatusException(
                                                HttpStatus.TOO_MANY_REQUESTS,
                                                "Gemini API quota exceeded. Please try again later.",
                                                e);
                        }

                        System.err.println(
                                        "[AI] Employee extraction FAILED after "
                                                        + elapsed
                                                        + " ms");

                        System.err.println(
                                        "[AI] Error: "
                                                        + message);

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "AI employee extraction failed",
                                        e);
                }
        }

        private boolean isQuotaOrRateLimitError(
                        Throwable error) {

                Throwable current = error;

                while (current != null) {

                        String message = current.getMessage();

                        if (message != null) {

                                String normalized = message.toLowerCase();

                                if (normalized.contains("429")
                                                || normalized.contains("resource_exhausted")
                                                || normalized.contains("quota")
                                                || normalized.contains("rate limit")
                                                || normalized.contains("rate_limit")
                                                || normalized.contains("too many requests")) {

                                        return true;
                                }
                        }

                        current = current.getCause();
                }

                return false;
        }

        public String classifyDecisionMakers(
                        String employeesJson) {

                if (employeesJson == null
                                || employeesJson.isBlank()) {

                        return """
                                        {
                                          "employees": []
                                        }
                                        """;
                }

                String prompt = """
                                You are a business decision-maker identification system.

                                Analyze the provided employees and determine whether each
                                person is likely to be a decision maker within their organization.

                                Consider roles such as:

                                HIGH-PROBABILITY DECISION MAKERS:
                                - Founder
                                - Co-Founder
                                - Owner
                                - CEO
                                - Chief Executive Officer
                                - CTO
                                - Chief Technology Officer
                                - CIO
                                - Chief Information Officer
                                - COO
                                - Chief Operating Officer
                                - CFO
                                - Chief Financial Officer
                                - CMO
                                - Chief Marketing Officer
                                - Managing Director
                                - Executive Director
                                - President

                                OTHER POTENTIAL DECISION MAKERS:
                                - Vice President
                                - VP
                                - Director
                                - Head of Department
                                - General Manager

                                Usually NOT decision makers:
                                - Intern
                                - Trainee
                                - Assistant
                                - Junior Developer
                                - Developer
                                - Engineer
                                - Designer
                                - Analyst
                                - Coordinator
                                - Associate

                                IMPORTANT:
                                - Judge the person's professional role, not their name.
                                - Do not invent information.
                                - Do not assume someone is a decision maker merely because
                                  they appear on a company employee page.
                                - Return one result for every supplied employee.
                                - Preserve the exact fullName from the input.
                                - Preserve the exact jobTitle from the input.

                                Return ONLY valid JSON.

                                Format:

                                {
                                  "employees": [
                                    {
                                      "fullName": "John Smith",
                                      "jobTitle": "Chief Technology Officer",
                                      "isDecisionMaker": true,
                                      "reason": "CTO is a senior executive role with significant technology decision authority.",
                                      "confidence": 0.98
                                    }
                                  ]
                                }

                                Employees to analyze:

                                %s
                                """
                                .formatted(employeesJson);

                long start = System.currentTimeMillis();

                try {

                        System.out.println(
                                        "[AI] Starting decision-maker classification");

                        GenerateContentResponse response = client.models.generateContent(
                                        "gemini-3.6-flash",
                                        prompt,
                                        null);

                        long elapsed = System.currentTimeMillis() - start;

                        System.out.println(
                                        "[AI] Decision-maker classification completed in "
                                                        + elapsed
                                                        + " ms");

                        return response.text();

                } catch (Exception e) {

                        long elapsed = System.currentTimeMillis() - start;

                        String message = e.getMessage() == null
                                        ? ""
                                        : e.getMessage();

                        if (isQuotaOrRateLimitError(e)) {

                                System.err.println(
                                                "[AI] QUOTA EXCEEDED during decision-maker classification after "
                                                                + elapsed
                                                                + " ms");

                                throw new ResponseStatusException(
                                                HttpStatus.TOO_MANY_REQUESTS,
                                                "Gemini API quota exceeded. Please try again later.",
                                                e);
                        }

                        System.err.println(
                                        "[AI] Decision-maker classification FAILED after "
                                                        + elapsed
                                                        + " ms");

                        System.err.println(
                                        "[AI] Error: "
                                                        + message);

                        throw new ResponseStatusException(
                                        HttpStatus.BAD_GATEWAY,
                                        "AI decision-maker classification failed",
                                        e);
                }
        }

        // public String generateEmployeeEmailCandidates(
        //                 String fullName,
        //                 String companyDomain) {

        //         if (fullName == null
        //                         || fullName.isBlank()
        //                         || companyDomain == null
        //                         || companyDomain.isBlank()) {

        //                 return """
        //                                 {
        //                                   "emails": []
        //                                 }
        //                                 """;
        //         }

        //         String prompt = """
        //                         You are a professional business-email pattern generation system.

        //                         Generate possible work-email addresses for the employee below.

        //                         IMPORTANT:
        //                         - These are CANDIDATES only.
        //                         - Do NOT claim that any candidate is verified.
        //                         - Do NOT invent an email address from information not reasonably
        //                           implied by the person's name and company domain.
        //                         - Use only the supplied company domain.
        //                         - Generate common professional email patterns.
        //                         - Maximum 5 candidates.
        //                         - Do not generate personal email providers such as Gmail, Yahoo,
        //                           Outlook, Hotmail, etc.
        //                         - Return ONLY valid JSON.

        //                         Employee:
        //                         Full name: %s

        //                         Company domain:
        //                         %s

        //                         Return:

        //                         {
        //                           "emails": [
        //                             {
        //                               "email": "john.smith@example.com",
        //                               "pattern": "first.last",
        //                               "confidence": 0.80
        //                             }
        //                           ]
        //                         }

        //                         If no reasonable candidates can be generated:

        //                         {
        //                           "emails": []
        //                         }
        //                         """.formatted(
        //                         fullName.trim(),
        //                         companyDomain.trim().toLowerCase());

        //         long start = System.currentTimeMillis();

        //         try {

        //                 System.out.println(
        //                                 "[AI] Generating email candidates for: "
        //                                                 + fullName
        //                                                 + " @ "
        //                                                 + companyDomain);

        //                 GenerateContentResponse response = client.models.generateContent(
        //                                 "gemini-3.6-flash",
        //                                 prompt,
        //                                 null);

        //                 long elapsed = System.currentTimeMillis() - start;

        //                 System.out.println(
        //                                 "[AI] Email candidate generation completed in "
        //                                                 + elapsed
        //                                                 + " ms");

        //                 return response.text();

        //         } catch (Exception e) {

        //                 long elapsed = System.currentTimeMillis() - start;

        //                 if (isQuotaOrRateLimitError(e)) {

        //                         System.err.println(
        //                                         "[AI] QUOTA EXCEEDED during email generation after "
        //                                                         + elapsed
        //                                                         + " ms");

        //                         throw new ResponseStatusException(
        //                                         HttpStatus.TOO_MANY_REQUESTS,
        //                                         "Gemini API quota exceeded. Please try again later.",
        //                                         e);
        //                 }

        //                 System.err.println(
        //                                 "[AI] Email candidate generation FAILED after "
        //                                                 + elapsed
        //                                                 + " ms");

        //                 System.err.println(
        //                                 "[AI] Error: "
        //                                                 + e.getMessage());

        //                 throw new ResponseStatusException(
        //                                 HttpStatus.BAD_GATEWAY,
        //                                 "AI email candidate generation failed",
        //                                 e);
        //         }
        // }

        // public List<EmployeeEmailCandidate> parseEmailCandidates(
        //                 String aiResult,
        //                 int maxCandidates) {

        //         if (aiResult == null || aiResult.isBlank()) {
        //                 return List.of();
        //         }

        //         try {

        //                 String json = aiResult.trim();

        //                 if (json.startsWith("```")) {
        //                         json = json
        //                                         .replaceFirst("^```json\\s*", "")
        //                                         .replaceFirst("^```\\s*", "")
        //                                         .replaceFirst("\\s*```$", "")
        //                                         .trim();
        //                 }

        //                 JsonNode root = objectMapper.readTree(json);

        //                 JsonNode emails = root.get("emails");

        //                 if (emails == null || !emails.isArray()) {
        //                         return List.of();
        //                 }

        //                 List<EmployeeEmailCandidate> candidates = new ArrayList<>();

        //                 for (JsonNode emailNode : emails) {

        //                         if (candidates.size() >= maxCandidates) {
        //                                 break;
        //                         }

        //                         String email = emailNode
        //                                         .path("email")
        //                                         .asText("");

        //                         String pattern = emailNode
        //                                         .path("pattern")
        //                                         .asText("");

        //                         double confidence = emailNode
        //                                         .path("confidence")
        //                                         .asDouble(0.0);

        //                         if (email.isBlank()) {
        //                                 continue;
        //                         }

        //                         candidates.add(
        //                                         new EmployeeEmailCandidate(
        //                                                         email.trim().toLowerCase(),
        //                                                         pattern.trim(),
        //                                                         confidence));
        //                 }

        //                 return candidates;

        //         } catch (Exception e) {

        //                 System.err.println(
        //                                 "[AI] Invalid email candidate JSON: "
        //                                                 + e.getMessage());

        //                 return List.of();
        //         }
        // }
}