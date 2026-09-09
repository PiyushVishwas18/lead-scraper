package com.leadscraper.backend.repository;

import com.leadscraper.backend.entity.UserCredit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserCreditRepository extends JpaRepository<UserCredit, UUID> {
    Optional<UserCredit> findByUserId(UUID userId);
}
