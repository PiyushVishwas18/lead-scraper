package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.employee.EmployeeLeadResponse;
import com.leadscraper.backend.dto.lead.AddLeadsToListRequest;
import com.leadscraper.backend.dto.lead.CreateListRequest;
import com.leadscraper.backend.dto.lead.SavedListResponse;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.service.CreditAndUsageService;
import com.leadscraper.backend.service.SavedListService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
public class SavedListController {

    private final SavedListService savedListService;
    private final CreditAndUsageService creditAndUsageService;
    private final UserRepository userRepository;

    public SavedListController(
            SavedListService savedListService,
            CreditAndUsageService creditAndUsageService,
            UserRepository userRepository) {
        this.savedListService = savedListService;
        this.creditAndUsageService = creditAndUsageService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<SavedListResponse> createList(
            Authentication authentication,
            @Valid @RequestBody CreateListRequest request) {
        UUID userId = getUserId(authentication);
        SavedListResponse list = savedListService.createList(userId, request);
        creditAndUsageService.logUsage(userId, "LIST_CREATED", 1);
        return ResponseEntity.ok(list);
    }

    @GetMapping
    public ResponseEntity<List<SavedListResponse>> getMyLists(
            Authentication authentication) {
        UUID userId = getUserId(authentication);
        List<SavedListResponse> lists = savedListService.getMyLists(userId);
        return ResponseEntity.ok(lists);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SavedListResponse> updateList(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody CreateListRequest request) {
        UUID userId = getUserId(authentication);
        SavedListResponse updated = savedListService.updateList(userId, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteList(
            Authentication authentication,
            @PathVariable UUID id) {
        UUID userId = getUserId(authentication);
        savedListService.deleteList(userId, id);
        return ResponseEntity.ok(Map.of("message", "List deleted successfully"));
    }

    @PostMapping("/{id}/leads")
    public ResponseEntity<Map<String, Object>> addLeadsToList(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody AddLeadsToListRequest request) {
        UUID userId = getUserId(authentication);
        int added = savedListService.addLeadsToList(userId, id, request.leadIds());
        return ResponseEntity.ok(Map.of("addedCount", added, "message", "Leads added to list successfully"));
    }

    @DeleteMapping("/{id}/leads/{leadId}")
    public ResponseEntity<Map<String, String>> removeLeadFromList(
            Authentication authentication,
            @PathVariable UUID id,
            @PathVariable UUID leadId) {
        UUID userId = getUserId(authentication);
        savedListService.removeLeadFromList(userId, id, leadId);
        return ResponseEntity.ok(Map.of("message", "Lead removed from list successfully"));
    }

    @GetMapping("/{id}/leads")
    public ResponseEntity<List<EmployeeLeadResponse>> getLeadsInList(
            Authentication authentication,
            @PathVariable UUID id) {
        UUID userId = getUserId(authentication);
        List<EmployeeLeadResponse> leads = savedListService.getLeadsInList(userId, id);
        return ResponseEntity.ok(leads);
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
        return user.getId();
    }
}
