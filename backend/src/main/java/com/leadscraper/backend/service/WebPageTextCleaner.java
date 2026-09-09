package com.leadscraper.backend.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.stereotype.Service;

@Service
public class WebPageTextCleaner {

    public String clean(String html) {

        if (html == null || html.isBlank()) {
            return "";
        }

        Document document = Jsoup.parse(html);

        // Remove content that is normally useless for employee extraction
        document.select("script, style, noscript, svg, iframe").remove();

        String text = document.body() != null
                ? document.body().text()
                : document.text();

        // Normalize whitespace
        text = text.replaceAll("\\s+", " ").trim();

        // Prevent unnecessarily huge AI requests
        int maxCharacters = 30000;

        if (text.length() > maxCharacters) {
            text = text.substring(0, maxCharacters);
        }

        return text;
    }
}