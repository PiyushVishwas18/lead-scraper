package com.leadscraper.backend.service;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {

    private final Client client;

    public GeminiService(
            @Value("${GEMINI_API_KEY}") String apiKey) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "GEMINI_API_KEY is missing or empty");
        }

        System.out.println(
                "Gemini API key loaded. Length = "
                        + apiKey.length());

        this.client = Client.builder()
                .apiKey(apiKey)
                .build();
    }

    public String testConnection() {

        long start = System.currentTimeMillis();

        try {

            System.out.println(
                    "[AI TEST] Testing Gemini connection...");

            GenerateContentResponse response = client.models.generateContent(
                    "gemini-3.6-flash",
                    "Reply with exactly: Gemini connection successful",
                    null);

            long elapsed = System.currentTimeMillis()
                    - start;

            System.out.println(
                    "[AI TEST] Gemini responded in "
                            + elapsed
                            + " ms");

            String result = response.text();

            if (result == null ||
                    result.isBlank()) {

                return "Gemini returned an empty response";
            }

            return result;

        } catch (Exception e) {

            long elapsed = System.currentTimeMillis()
                    - start;

            String message = e.getMessage() == null
                    ? ""
                    : e.getMessage();

            if (message.contains("429")
                    || message.contains("RESOURCE_EXHAUSTED")
                    || message.contains("quota")) {

                System.err.println(
                        "[AI TEST] Gemini quota exceeded after "
                                + elapsed
                                + " ms");

                return "Gemini API quota exceeded. "
                        + "The current Gemini free-tier request limit "
                        + "has been reached. Please wait for the quota "
                        + "to reset before testing again.";
            }

            System.err.println(
                    "[AI TEST] Gemini connection failed after "
                            + elapsed
                            + " ms");

            System.err.println(
                    "[AI TEST] Error: "
                            + message);

            return "Gemini connection failed: "
                    + message;
        }
    }
}