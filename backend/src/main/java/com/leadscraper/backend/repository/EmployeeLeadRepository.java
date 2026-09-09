package com.leadscraper.backend.repository;

import com.leadscraper.backend.entity.EmployeeLead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface EmployeeLeadRepository
                extends JpaRepository<EmployeeLead, UUID> {

        List<EmployeeLead> findByOwnerId(UUID ownerId);

        List<EmployeeLead> findByOwnerIdAndIsDecisionMaker(
                        UUID ownerId,
                        Boolean isDecisionMaker);

        List<EmployeeLead> findByOwnerIdAndFullNameContainingIgnoreCase(
                        UUID ownerId,
                        String fullName);

        List<EmployeeLead> findByOwnerIdAndJobTitleContainingIgnoreCase(
                        UUID ownerId,
                        String jobTitle);

        List<EmployeeLead> findByOwnerIdAndCompanyNameContainingIgnoreCase(
                        UUID ownerId,
                        String companyName);

        List<EmployeeLead> findByOwnerIdAndStatus(
                        UUID ownerId,
                        String status);

        List<EmployeeLead> findByOwnerIdAndEmailStatus(
                        UUID ownerId,
                        String emailStatus);

        List<EmployeeLead> findByOwnerIdAndCompanyNameIgnoreCase(
                        UUID ownerId,
                        String companyName);

        boolean existsByOwnerIdAndWorkEmail(
                        UUID ownerId,
                        String workEmail);

        /*
         * Persistent discovery cache:
         *
         * Find all employees belonging to a company domain.
         */
        List<EmployeeLead> findByOwnerIdAndCompanyDomainIgnoreCase(
                        UUID ownerId,
                        String companyDomain);

        /*
         * Find the most recently discovered employee for a company.
         *
         * This lets the service determine whether the company's
         * discovery data is still fresh.
         */
        List<EmployeeLead> findByOwnerIdAndCompanyDomainIgnoreCaseOrderByLastDiscoveredAtDesc(
                        UUID ownerId,
                        String companyDomain);
}