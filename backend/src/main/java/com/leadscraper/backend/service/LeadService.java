package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.lead.CreateLeadRequest;
import com.leadscraper.backend.dto.lead.LeadResponse;
import com.leadscraper.backend.dto.scraper.OverturePlace;
import com.leadscraper.backend.entity.Lead;
import com.leadscraper.backend.repository.LeadRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class LeadService {

    private final LeadRepository leadRepository;

    public LeadService(LeadRepository leadRepository) {
        this.leadRepository = leadRepository;
    }

    @Transactional
    public LeadResponse createLead(
            UUID ownerId,
            CreateLeadRequest request) {

        Instant now = Instant.now();

        Lead lead = new Lead();

        lead.setOwnerId(ownerId);
        lead.setCompanyName(request.companyName().trim());
        lead.setContactName(request.contactName());
        lead.setEmail(request.email());
        lead.setPhone(request.phone());
        lead.setWebsite(request.website());
        lead.setAddress(request.address());
        lead.setCity(request.city());
        lead.setState(request.state());
        lead.setCountry(request.country());
        lead.setSource(request.source());
        lead.setSourceUrl(request.sourceUrl());

        lead.setStatus("NEW");
        lead.setCreatedAt(now);
        lead.setUpdatedAt(now);

        Lead savedLead = leadRepository.save(lead);

        return toResponse(savedLead);
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> getMyLeads(UUID ownerId) {

        return leadRepository.findByOwnerId(ownerId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<LeadResponse> saveScrapedLeads(
            UUID ownerId,
            List<OverturePlace> places) {

        Instant now = Instant.now();

        List<Lead> leads = places.stream()
                .map(place -> {

                    Lead lead = new Lead();

                    lead.setOwnerId(ownerId);
                    lead.setCompanyName(place.name());
                    lead.setContactName(null);
                    lead.setEmail(place.email());
                    lead.setPhone(place.phone());
                    lead.setWebsite(place.website());
                    lead.setAddress(place.address());
                    lead.setCity(place.city());
                    lead.setState(place.state());
                    lead.setCountry(place.country());

                    lead.setSource("Overture Maps");
                    lead.setSourceUrl(null);

                    lead.setStatus("NEW");
                    lead.setCreatedAt(now);
                    lead.setUpdatedAt(now);

                    return lead;
                })
                .toList();

        return leadRepository.saveAll(leads)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LeadResponse updateStatus(
            UUID ownerId,
            UUID leadId,
            String status) {

        String normalizedStatus = status
                .trim()
                .toUpperCase();

        if (!isValidStatus(normalizedStatus)) {
            throw new IllegalArgumentException(
                    "Invalid lead status: " + status);
        }

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Lead not found"));

        if (!lead.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException(
                    "You are not allowed to update this lead");
        }

        lead.setStatus(normalizedStatus);
        lead.setUpdatedAt(Instant.now());

        Lead updatedLead = leadRepository.save(lead);

        return toResponse(updatedLead);
    }

    @Transactional
    public void deleteLead(
            UUID ownerId,
            UUID leadId) {

        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Lead not found"));

        if (!lead.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException(
                    "You are not allowed to delete this lead");
        }

        leadRepository.delete(lead);
    }

    private boolean isValidStatus(String status) {

        return status.equals("NEW")
                || status.equals("CONTACTED")
                || status.equals("QUALIFIED")
                || status.equals("CONVERTED")
                || status.equals("REJECTED");
    }

    private LeadResponse toResponse(Lead lead) {

        return new LeadResponse(
                lead.getId(),
                lead.getCompanyName(),
                lead.getContactName(),
                lead.getEmail(),
                lead.getPhone(),
                lead.getWebsite(),
                lead.getAddress(),
                lead.getCity(),
                lead.getState(),
                lead.getCountry(),
                lead.getSource(),
                lead.getSourceUrl(),
                lead.getStatus(),
                lead.getCreatedAt(),
                lead.getUpdatedAt());
    }
}