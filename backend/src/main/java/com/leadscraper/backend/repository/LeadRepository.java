package com.leadscraper.backend.repository;

import com.leadscraper.backend.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LeadRepository extends JpaRepository<Lead, UUID> {

    List<Lead> findByOwnerId(UUID ownerId);

    List<Lead> findByOwnerIdAndStatus(UUID ownerId, String status);
}