package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.lead.CreateListRequest;
import com.leadscraper.backend.dto.lead.SavedListResponse;
import com.leadscraper.backend.entity.EmployeeLead;
import com.leadscraper.backend.entity.SavedList;
import com.leadscraper.backend.entity.SavedListLeadId;
import com.leadscraper.backend.entity.User;
import com.leadscraper.backend.exception.ForbiddenException;
import com.leadscraper.backend.exception.ResourceNotFoundException;
import com.leadscraper.backend.repository.EmployeeLeadRepository;
import com.leadscraper.backend.repository.SavedListLeadRepository;
import com.leadscraper.backend.repository.SavedListRepository;
import com.leadscraper.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class SavedListDeleteTest {

    @Autowired
    private SavedListService savedListService;

    @Autowired
    private SavedListRepository savedListRepository;

    @Autowired
    private SavedListLeadRepository savedListLeadRepository;

    @Autowired
    private EmployeeLeadRepository employeeLeadRepository;

    @Autowired
    private UserRepository userRepository;

    private User createTestUser(String prefix) {
        User user = new User();
        user.setEmail(prefix + "_" + UUID.randomUUID() + "@leadscraper.com");
        user.setPasswordHash("hashed_password");
        user.setFirstName("Test");
        user.setLastName("User");
        user.setStatus("ACTIVE");
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    @Test
    public void testDeleteNonExistentListThrowsResourceNotFoundException() {
        UUID ownerId = UUID.randomUUID();
        UUID nonExistentListId = UUID.randomUUID();

        assertThrows(ResourceNotFoundException.class, () -> {
            savedListService.deleteList(ownerId, nonExistentListId);
        });
    }

    @Test
    public void testDeleteOtherUserListThrowsForbiddenException() {
        User owner = createTestUser("owner");
        User otherUser = createTestUser("other");

        SavedList list = new SavedList(owner.getId(), "Owner's List", "Testing ownership");
        SavedList saved = savedListRepository.save(list);

        try {
            assertThrows(ForbiddenException.class, () -> {
                savedListService.deleteList(otherUser.getId(), saved.getId());
            });
        } finally {
            savedListRepository.delete(saved);
            userRepository.delete(otherUser);
            userRepository.delete(owner);
        }
    }

    @Test
    public void testDeleteListRemovesAssociationsAndPreservesLeads() {
        User owner = createTestUser("listowner");
        UUID ownerId = owner.getId();

        try {
            // 1. Create list
            CreateListRequest createRequest = new CreateListRequest("Q4 Prospects", "Outreach campaign");
            SavedListResponse listResponse = savedListService.createList(ownerId, createRequest);
            UUID listId = listResponse.id();
            assertNotNull(listId);

            // 2. Create lead
            EmployeeLead lead = new EmployeeLead();
            lead.setOwnerId(ownerId);
            lead.setFullName("Jane Doe");
            lead.setCompanyName("Acme Corp");
            lead.setEmailStatus("NOT_CHECKED");
            lead.setStatus("NEW");
            lead.setCreatedAt(Instant.now());
            lead.setUpdatedAt(Instant.now());
            EmployeeLead savedLead = employeeLeadRepository.save(lead);
            UUID leadId = savedLead.getId();
            assertNotNull(leadId);

            // 3. Add lead to list
            var result = savedListService.addLeadsToList(ownerId, listId, List.of(leadId));
            assertEquals(1, result.addedCount());

            // Verify association exists
            SavedListLeadId linkId = new SavedListLeadId(listId, leadId);
            assertTrue(savedListLeadRepository.existsById(linkId));

            // 4. Delete list as owner
            savedListService.deleteList(ownerId, listId);

            // 5. Verify list is deleted
            assertFalse(savedListRepository.existsById(listId));

            // 6. Verify association is deleted
            assertFalse(savedListLeadRepository.existsById(linkId));

            // 7. Verify actual lead record is NOT deleted
            assertTrue(employeeLeadRepository.existsById(leadId));

            // Clean up lead
            employeeLeadRepository.delete(savedLead);
        } finally {
            userRepository.delete(owner);
        }
    }
}
