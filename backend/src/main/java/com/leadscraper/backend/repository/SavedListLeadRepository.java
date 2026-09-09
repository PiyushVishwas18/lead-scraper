package com.leadscraper.backend.repository;

import com.leadscraper.backend.entity.SavedListLead;
import com.leadscraper.backend.entity.SavedListLeadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SavedListLeadRepository extends JpaRepository<SavedListLead, SavedListLeadId> {
    List<SavedListLead> findByIdListId(UUID listId);
    long countByIdListId(UUID listId);
    void deleteByIdListIdAndIdLeadId(UUID listId, UUID leadId);
}
