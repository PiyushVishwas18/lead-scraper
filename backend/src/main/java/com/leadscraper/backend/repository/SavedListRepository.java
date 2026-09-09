package com.leadscraper.backend.repository;

import com.leadscraper.backend.entity.SavedList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SavedListRepository extends JpaRepository<SavedList, UUID> {
    List<SavedList> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    Optional<SavedList> findByIdAndOwnerId(UUID id, UUID ownerId);
}
