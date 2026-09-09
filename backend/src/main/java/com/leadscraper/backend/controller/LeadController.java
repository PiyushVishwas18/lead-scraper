package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.lead.CreateLeadRequest;
import com.leadscraper.backend.dto.lead.LeadResponse;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.service.LeadService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leads")
public class LeadController {

        private final LeadService leadService;
        private final UserRepository userRepository;

        public LeadController(
                        LeadService leadService,
                        UserRepository userRepository) {

                this.leadService = leadService;
                this.userRepository = userRepository;
        }

        @PostMapping
        public ResponseEntity<LeadResponse> createLead(
                        Authentication authentication,
                        @Valid @RequestBody CreateLeadRequest request) {

                UUID userId = getAuthenticatedUserId(authentication);

                LeadResponse response = leadService.createLead(userId, request);

                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(response);
        }

        @GetMapping
        public ResponseEntity<List<LeadResponse>> getMyLeads(
                        Authentication authentication) {

                UUID userId = getAuthenticatedUserId(authentication);

                return ResponseEntity.ok(
                                leadService.getMyLeads(userId));
        }

        @PatchMapping("/{leadId}/status")
        public ResponseEntity<LeadResponse> updateStatus(
                        Authentication authentication,
                        @PathVariable UUID leadId,
                        @RequestParam String status) {

                UUID userId = getAuthenticatedUserId(authentication);

                LeadResponse response = leadService.updateStatus(
                                userId,
                                leadId,
                                status);

                return ResponseEntity.ok(response);
        }

        @DeleteMapping("/{leadId}")
        public ResponseEntity<Void> deleteLead(
                        Authentication authentication,
                        @PathVariable UUID leadId) {

                UUID userId = getAuthenticatedUserId(authentication);

                leadService.deleteLead(userId, leadId);

                return ResponseEntity.noContent().build();
        }

        private UUID getAuthenticatedUserId(
                        Authentication authentication) {

                String email = authentication.getName();

                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new IllegalStateException(
                                                "Authenticated user no longer exists"));

                return user.getId();
        }
}