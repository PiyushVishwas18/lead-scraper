package com.leadscraper.backend.controller;

import com.leadscraper.backend.dto.employee.EmployeeLeadResponse;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.repository.UserRepository;
import com.leadscraper.backend.service.ExportService;
import com.leadscraper.backend.service.SavedListService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ExportService exportService;
    private final SavedListService savedListService;
    private final UserRepository userRepository;

    public ExportController(
            ExportService exportService,
            SavedListService savedListService,
            UserRepository userRepository) {
        this.exportService = exportService;
        this.savedListService = savedListService;
        this.userRepository = userRepository;
    }

    @PostMapping("/leads")
    public ResponseEntity<String> exportLeads(
            Authentication authentication,
            @RequestBody List<EmployeeLeadResponse> leads) {
        String csv = exportService.generateCsv(leads);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"leads_export.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/lists/{listId}")
    public ResponseEntity<String> exportList(
            Authentication authentication,
            @PathVariable UUID listId) {
        UUID userId = getUserId(authentication);
        List<EmployeeLeadResponse> leads = savedListService.getLeadsInList(userId, listId);
        String csv = exportService.generateCsv(leads);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"list_export_" + listId + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    private UUID getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
        return user.getId();
    }
}
