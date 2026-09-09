package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.employee.EmployeeLeadResponse;
import com.leadscraper.backend.dto.lead.SearchFilterRequest;
import com.leadscraper.backend.entity.EmployeeLead;
import com.leadscraper.backend.repository.EmployeeLeadRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

@Service
public class PeopleSearchService {

    private final EmployeeLeadRepository employeeLeadRepository;
    private final EmployeeLeadService employeeLeadService;

    public PeopleSearchService(
            EmployeeLeadRepository employeeLeadRepository,
            EmployeeLeadService employeeLeadService) {

        this.employeeLeadRepository = employeeLeadRepository;
        this.employeeLeadService = employeeLeadService;
    }

    @Transactional(readOnly = true)
    public Page<EmployeeLeadResponse> searchPeople(
            UUID ownerId,
            SearchFilterRequest request) {

        List<EmployeeLead> leads = filterLeads(ownerId, request);

        int page = request.page();
        int size = request.size();

        Pageable pageable = PageRequest.of(page, size);

        int start = (int) pageable.getOffset();

        if (start >= leads.size()) {
            return new PageImpl<>(
                    List.of(),
                    pageable,
                    leads.size());
        }

        int end = Math.min(
                start + pageable.getPageSize(),
                leads.size());

        List<EmployeeLeadResponse> content = leads.subList(start, end)
                .stream()
                .map(employeeLeadService::toResponse)
                .toList();

        return new PageImpl<>(
                content,
                pageable,
                leads.size());
    }

    @Transactional(readOnly = true)
    public long countPeople(
            UUID ownerId,
            SearchFilterRequest request) {

        return filterLeads(ownerId, request).size();
    }

    private List<EmployeeLead> filterLeads(
            UUID ownerId,
            SearchFilterRequest request) {

        List<EmployeeLead> leads = employeeLeadRepository.findByOwnerId(ownerId);

        if (request == null) {
            return leads;
        }

        return leads.stream()
                .filter(lead -> matchesQuery(lead, request))
                .filter(lead -> matchesJobTitle(lead, request))
                .filter(lead -> matchesDepartment(lead, request))
                .filter(lead -> matchesSeniority(lead, request))
                .filter(lead -> matchesPersonName(lead, request))
                .filter(lead -> matchesCompanyName(lead, request))
                .filter(lead -> matchesCompanyDomain(lead, request))
                .filter(lead -> matchesIndustry(lead, request))
                .filter(lead -> matchesCompanySize(lead, request))
                .filter(lead -> matchesEmployeeRange(lead, request))
                .filter(lead -> matchesRevenue(lead, request))
                .filter(lead -> matchesFunding(lead, request))
                .filter(lead -> matchesTechnology(lead, request))
                .filter(lead -> matchesCity(lead, request))
                .filter(lead -> matchesState(lead, request))
                .filter(lead -> matchesCountry(lead, request))
                .filter(lead -> matchesEmailStatus(lead, request))
                .filter(lead -> matchesPhoneAvailable(lead, request))
                .filter(lead -> matchesDecisionMaker(lead, request))
                .filter(lead -> matchesLeadStatus(lead, request))
                .sorted(buildComparator(request.sort()))
                .toList();
    }

    private boolean matchesQuery(
            EmployeeLead lead,
            SearchFilterRequest request) {

        String query = request.query();

        if (query == null || query.isBlank()) {
            return true;
        }

        return containsIgnoreCase(lead.getFullName(), query)
                || containsIgnoreCase(lead.getJobTitle(), query)
                || containsIgnoreCase(lead.getCompanyName(), query)
                || containsIgnoreCase(lead.getIndustry(), query);
    }

    private boolean matchesJobTitle(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.jobTitle())
                || containsIgnoreCase(
                        lead.getJobTitle(),
                        request.jobTitle());
    }

    private boolean matchesDepartment(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.department())
                || containsIgnoreCase(
                        lead.getDepartment(),
                        request.department());
    }

    private boolean matchesSeniority(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.seniority())
                || equalsIgnoreCase(
                        lead.getSeniority(),
                        request.seniority());
    }

    private boolean matchesPersonName(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.personName())
                || containsIgnoreCase(
                        lead.getFullName(),
                        request.personName());
    }

    private boolean matchesCompanyName(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.companyName())
                || containsIgnoreCase(
                        lead.getCompanyName(),
                        request.companyName());
    }

    private boolean matchesCompanyDomain(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.companyDomain())
                || containsIgnoreCase(
                        lead.getCompanyDomain(),
                        request.companyDomain());
    }

    private boolean matchesIndustry(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.industry())
                || containsIgnoreCase(
                        lead.getIndustry(),
                        request.industry());
    }

    private boolean matchesCompanySize(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.companySize())
                || containsIgnoreCase(
                        lead.getCompanyName(),
                        request.companySize());
    }

    private boolean matchesEmployeeRange(
            EmployeeLead lead,
            SearchFilterRequest request) {

        /*
         * EmployeeLead currently does not contain an employee-count field.
         *
         * Therefore minEmployees/maxEmployees cannot be evaluated against
         * stored lead data yet. We leave these filters non-blocking rather
         * than incorrectly excluding valid leads.
         */
        return true;
    }

    private boolean matchesRevenue(
            EmployeeLead lead,
            SearchFilterRequest request) {

        /*
         * Revenue is not currently stored on EmployeeLead.
         */
        return true;
    }

    private boolean matchesFunding(
            EmployeeLead lead,
            SearchFilterRequest request) {

        /*
         * Funding is not currently stored on EmployeeLead.
         */
        return true;
    }

    private boolean matchesTechnology(
            EmployeeLead lead,
            SearchFilterRequest request) {

        /*
         * Technology is not currently stored on EmployeeLead.
         */
        return true;
    }

    private boolean matchesCity(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.city())
                || containsIgnoreCase(
                        lead.getCity(),
                        request.city());
    }

    private boolean matchesState(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.state())
                || containsIgnoreCase(
                        lead.getState(),
                        request.state());
    }

    private boolean matchesCountry(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.country())
                || containsIgnoreCase(
                        lead.getCountry(),
                        request.country());
    }

    private boolean matchesEmailStatus(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.emailStatus())
                || equalsIgnoreCase(
                        lead.getEmailStatus(),
                        request.emailStatus());
    }

    private boolean matchesPhoneAvailable(
            EmployeeLead lead,
            SearchFilterRequest request) {

        Boolean requested = request.phoneAvailable();

        if (requested == null) {
            return true;
        }

        boolean available = lead.getPhone() != null
                && !lead.getPhone().isBlank();

        return available == requested;
    }

    private boolean matchesDecisionMaker(
            EmployeeLead lead,
            SearchFilterRequest request) {

        Boolean requested = request.isDecisionMaker();

        if (requested == null) {
            return true;
        }

        return Objects.equals(
                lead.getIsDecisionMaker(),
                requested);
    }

    private boolean matchesLeadStatus(
            EmployeeLead lead,
            SearchFilterRequest request) {

        return isBlank(request.leadStatus())
                || equalsIgnoreCase(
                        lead.getStatus(),
                        request.leadStatus());
    }

    private Comparator<EmployeeLead> buildComparator(
            String sort) {

        String normalizedSort = isBlank(sort)
                ? "newest"
                : sort.trim().toLowerCase(Locale.ROOT);

        return switch (normalizedSort) {

            case "newest" ->
                Comparator.comparing(
                        EmployeeLead::getCreatedAt,
                        Comparator.nullsLast(
                                Comparator.naturalOrder()))
                        .reversed();

            case "oldest" ->
                Comparator.comparing(
                        EmployeeLead::getCreatedAt,
                        Comparator.nullsLast(
                                Comparator.naturalOrder()));

            case "nameasc" ->
                Comparator.comparing(
                        lead -> safeLower(lead.getFullName()));

            case "namedesc" ->
                Comparator.comparing(
                        (EmployeeLead lead) -> safeLower(lead.getFullName())).reversed();

            case "confidencehigh" ->
                Comparator.comparing(
                        EmployeeLead::getConfidence,
                        Comparator.nullsLast(
                                Comparator.naturalOrder()))
                        .reversed();

            case "confidencelow" ->
                Comparator.comparing(
                        EmployeeLead::getConfidence,
                        Comparator.nullsLast(
                                Comparator.naturalOrder()));

            default ->
                Comparator.comparing(
                        EmployeeLead::getCreatedAt,
                        Comparator.nullsLast(
                                Comparator.naturalOrder()))
                        .reversed();
        };
    }

    private boolean containsIgnoreCase(
            String value,
            String searchValue) {

        if (value == null || searchValue == null) {
            return false;
        }

        return value
                .toLowerCase(Locale.ROOT)
                .contains(
                        searchValue
                                .toLowerCase(Locale.ROOT)
                                .trim());
    }

    private boolean equalsIgnoreCase(
            String value,
            String expected) {

        if (value == null || expected == null) {
            return false;
        }

        return value.trim()
                .equalsIgnoreCase(expected.trim());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String safeLower(String value) {
        return value == null
                ? ""
                : value.toLowerCase(Locale.ROOT);
    }
}