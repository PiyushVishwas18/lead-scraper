package com.leadscraper.backend.repository;

import com.leadscraper.backend.entity.UserRole;
import com.leadscraper.backend.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {
}