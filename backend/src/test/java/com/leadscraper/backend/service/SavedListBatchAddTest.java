package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.lead.BatchAddLeadsResult;
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
public class SavedListBatchAddTest {

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

    private EmployeeLead createTestLead(UUID ownerId, String name, String company) {
        EmployeeLead lead = new EmployeeLead();
        lead.setOwnerId(ownerId);
        lead.setFullName(name);
        lead.setCompanyName(company);
        lead.setEmailStatus("NOT_CHECKED");
        lead.setStatus("NEW");
        lead.setCreatedAt(Instant.now());
        lead.setUpdatedAt(Instant.now());
        return employeeLeadRepository.save(lead);
    }

    @Test
    public void testAddMultipleLeadsAndPreventDuplicates() {
        User user = createTestUser("batchuser");
        UUID ownerId = user.getId();

        try {
            // 1. Create list
            SavedListResponse list = savedListService.createList(ownerId, new CreateListRequest("Tech Leaders", "Batch test"));
            UUID listId = list.id();

            // 2. Create 3 leads for this user
            EmployeeLead lead1 = createTestLead(ownerId, "Alice Smith", "Acme Inc");
            EmployeeLead lead2 = createTestLead(ownerId, "Bob Jones", "Beta Corp");
            EmployeeLead lead3 = createTestLead(ownerId, "Charlie Brown", "Gamma LLC");

            // 3. Add first 2 leads in batch
            BatchAddLeadsResult res1 = savedListService.addLeadsToList(ownerId, listId, List.of(lead1.getId(), lead2.getId()));
            assertEquals(2, res1.addedCount());
            assertEquals(0, res1.alreadyPresentCount());

            // Check associations exist
            assertTrue(savedListLeadRepository.existsById(new SavedListLeadId(listId, lead1.getId())));
            assertTrue(savedListLeadRepository.existsById(new SavedListLeadId(listId, lead2.getId())));
            assertFalse(savedListLeadRepository.existsById(new SavedListLeadId(listId, lead3.getId())));

            // 4. Batch add lead2 (duplicate) and lead3 (new)
            BatchAddLeadsResult res2 = savedListService.addLeadsToList(ownerId, listId, List.of(lead2.getId(), lead3.getId()));
            assertEquals(1, res2.addedCount(), "Only lead3 should be newly added");
            assertEquals(1, res2.alreadyPresentCount(), "lead2 should be detected as already present");

            // Verify all 3 associations exist now
            assertTrue(savedListLeadRepository.existsById(new SavedListLeadId(listId, lead1.getId())));
            assertTrue(savedListLeadRepository.existsById(new SavedListLeadId(listId, lead2.getId())));
            assertTrue(savedListLeadRepository.existsById(new SavedListLeadId(listId, lead3.getId())));

            // Clean up
            savedListService.deleteList(ownerId, listId);
            employeeLeadRepository.delete(lead1);
            employeeLeadRepository.delete(lead2);
            employeeLeadRepository.delete(lead3);
        } finally {
            userRepository.delete(user);
        }
    }

    @Test
    public void testCannotAddLeadsToAnotherUserList() {
        User owner = createTestUser("owneruser");
        User attacker = createTestUser("attackeruser");

        try {
            SavedListResponse list = savedListService.createList(owner.getId(), new CreateListRequest("Private List", "Secret"));
            EmployeeLead lead = createTestLead(attacker.getId(), "Attacker Lead", "Dark Corp");

            assertThrows(ForbiddenException.class, () -> {
                savedListService.addLeadsToList(attacker.getId(), list.id(), List.of(lead.getId()));
            });

            // Clean up
            savedListService.deleteList(owner.getId(), list.id());
            employeeLeadRepository.delete(lead);
        } finally {
            userRepository.delete(attacker);
            userRepository.delete(owner);
        }
    }

    @Test
    public void testCannotAddAnotherUserLeads() {
        User user1 = createTestUser("user1");
        User user2 = createTestUser("user2");

        try {
            SavedListResponse list = savedListService.createList(user1.getId(), new CreateListRequest("User1 List", "Test"));
            EmployeeLead otherLead = createTestLead(user2.getId(), "Other User Lead", "Other Corp");

            // User1 tries to add User2's lead
            BatchAddLeadsResult res = savedListService.addLeadsToList(user1.getId(), list.id(), List.of(otherLead.getId()));
            assertEquals(0, res.addedCount(), "Should not add leads belonging to another user");
            assertEquals(0, res.alreadyPresentCount());

            assertFalse(savedListLeadRepository.existsById(new SavedListLeadId(list.id(), otherLead.getId())));

            // Clean up
            savedListService.deleteList(user1.getId(), list.id());
            employeeLeadRepository.delete(otherLead);
        } finally {
            userRepository.delete(user1);
            userRepository.delete(user2);
        }
    }

    @Test
    public void testAddLeadsToNonExistentListThrows404() {
        User user = createTestUser("user404");
        UUID randomListId = UUID.randomUUID();

        try {
            assertThrows(ResourceNotFoundException.class, () -> {
                savedListService.addLeadsToList(user.getId(), randomListId, List.of(UUID.randomUUID()));
            });
        } finally {
            userRepository.delete(user);
        }
    }
}
