package com.leadscraper.backend.service;

import org.springframework.stereotype.Service;

import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;
import java.util.regex.Pattern;

@Service
public class EmailVerificationService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    public VerificationResult verify(String email) {

        if (email == null || email.isBlank()) {

            return new VerificationResult(
                    email,
                    "INVALID",
                    1.0,
                    "Email address is empty");
        }

        String normalizedEmail = email.trim().toLowerCase();

        if (!EMAIL_PATTERN.matcher(normalizedEmail).matches()) {

            return new VerificationResult(
                    normalizedEmail,
                    "INVALID",
                    1.0,
                    "Invalid email address format");
        }

        String domain = normalizedEmail.substring(
                normalizedEmail.indexOf('@') + 1);

        try {

            boolean hasMailServer = hasMxRecord(domain);

            if (!hasMailServer) {

                return new VerificationResult(
                        normalizedEmail,
                        "INVALID",
                        0.95,
                        "Domain has no MX mail server");
            }

            /*
             * MX records prove that the domain has mail infrastructure.
             */
            return new VerificationResult(
                    normalizedEmail,
                    "VALID",
                    0.90,
                    "Domain has valid MX mail server (mail infrastructure confirmed)");

        } catch (Exception e) {

            return new VerificationResult(
                    normalizedEmail,
                    "UNKNOWN",
                    0.30,
                    "Could not complete DNS mail-server verification");
        }
    }

    private boolean hasMxRecord(String domain) throws Exception {

        Hashtable<String, String> environment = new Hashtable<>();

        environment.put(
                "java.naming.factory.initial",
                "com.sun.jndi.dns.DnsContextFactory");

        environment.put(
                "java.naming.provider.url",
                "dns:");

        DirContext context = new InitialDirContext(environment);

        try {

            Attributes attributes = context.getAttributes(
                    domain,
                    new String[] { "MX" });

            Attribute mx = attributes.get("MX");

            return mx != null && mx.size() > 0;

        } finally {

            context.close();
        }
    }

    public record VerificationResult(
            String email,
            String status,
            double confidence,
            String reason) {
    }
}