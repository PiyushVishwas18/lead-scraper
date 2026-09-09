package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.employee.EmployeeLeadResponse;
import com.leadscraper.backend.dto.lead.CreateListRequest;
import com.leadscraper.backend.dto.lead.SavedListResponse;
import com.leadscraper.backend.entity.EmployeeLead;
import com.leadscraper.backend.entity.SavedList;
import com.leadscraper.backend.entity.SavedListLead;
import com.leadscraper.backend.entity.SavedListLeadId;
import com.leadscraper.backend.repository.EmployeeLeadRepository;
import com.leadscraper.backend.repository.SavedListLeadRepository;
import com.leadscraper.backend.repository.SavedListRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SavedListService {

    private final SavedListRepository savedListRepository;
    private final SavedListLeadRepository savedListLeadRepository;
    private final EmployeeLeadRepository employeeLeadRepository;
    private final EmployeeLeadService employeeLeadService;

    public SavedListService(
            SavedListRepository savedListRepository,
            SavedListLeadRepository savedListLeadRepository,
            EmployeeLeadRepository employeeLeadRepository,
            EmployeeLeadService employeeLeadService) {
        this.savedListRepository = savedListRepository;
        this.savedListLeadRepository = savedListLeadRepository;
        this.employeeLeadRepository = employeeLeadRepository;
        this.employeeLeadService = employeeLeadService;
    }

    @Transactional
    public SavedListResponse createList(UUID ownerId, CreateListRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new IllegalArgumentException("List name is required");
        }
        SavedList savedList = new SavedList(ownerId, request.name().trim(), request.description());
        SavedList saved = savedListRepository.save(savedList);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SavedListResponse> getMyLists(UUID ownerId) {
        List<SavedList> lists = savedListRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        return lists.stream().map(this::toResponse).toList();
    }

    @Transactional
    public SavedListResponse updateList(UUID ownerId, UUID listId, CreateListRequest request) {
        SavedList list = savedListRepository.findByIdAndOwnerId(listId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Saved list not found"));
        if (request.name() != null && !request.name().isBlank()) {
            list.setName(request.name().trim());
        }
        if (request.description() != null) {
            list.setDescription(request.description());
        }
        list.setUpdatedAt(Instant.now());
        return toResponse(savedListRepository.save(list));
    }

    @Transactional
    public void deleteList(UUID ownerId, UUID listId) {
        SavedList list = savedListRepository.findByIdAndOwnerId(listId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Saved list not found"));
        savedListRepository.delete(list);
    }

    @Transactional
    public int addLeadsToList(UUID ownerId, UUID listId, List<UUID> leadIds) {
        SavedList list = savedListRepository.findByIdAndOwnerId(listId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Saved list not found"));

        int addedCount = 0;
        for (UUID leadId : leadIds) {
            if (leadId == null) continue;
            EmployeeLead lead = employeeLeadRepository.findById(leadId).orElse(null);
            if (lead != null && lead.getOwnerId().equals(ownerId)) {
                SavedListLeadId linkId = new SavedListLeadId(list.getId(), leadId);
                if (!savedListLeadRepository.existsById(linkId)) {
                    savedListLeadRepository.save(new SavedListLead(linkId));
                    addedCount++;
                }
            }
        }
        list.setUpdatedAt(Instant.now());
        savedListRepository.save(list);
        return addedCount;
    }

    @Transactional
    public void removeLeadFromList(UUID ownerId, UUID listId, UUID leadId) {
        savedListRepository.findByIdAndOwnerId(listId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Saved list not found"));
        savedListLeadRepository.deleteByIdListIdAndIdLeadId(listId, leadId);
    }

    @Transactional(readOnly = true)
    public List<EmployeeLeadResponse> getLeadsInList(UUID ownerId, UUID listId) {
        savedListRepository.findByIdAndOwnerId(listId, ownerId)
                .orElseThrow(() -> new IllegalArgumentException("Saved list not found"));

        List<SavedListLead> links = savedListLeadRepository.findByIdListId(listId);
        List<EmployeeLeadResponse> responses = new ArrayList<>();
        for (SavedListLead link : links) {
            employeeLeadRepository.findById(link.getId().getLeadId())
                    .ifPresent(lead -> {
                        if (lead.getOwnerId().equals(ownerId)) {
                            responses.add(employeeLeadService.toResponse(lead));
                        }
                    });
        }
        return responses;
    }

    private SavedListResponse toResponse(SavedList list) {
        long count = savedListLeadRepository.countByIdListId(list.getId());
        return new SavedListResponse(
                list.getId(),
                list.getName(),
                list.getDescription(),
                count,
                list.getCreatedAt(),
                list.getUpdatedAt()
        );
    }
}
