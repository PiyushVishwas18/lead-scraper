package com.leadscraper.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "employee_leads")
public class EmployeeLead {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "job_title", length = 255)
    private String jobTitle;

    @Column(name = "department", length = 150)
    private String department;

    @Column(name = "seniority", length = 100)
    private String seniority;

    @Column(name = "professional_url", length = 1000)
    private String professionalUrl;

    @Column(name = "company_name", nullable = false, length = 255)
    private String companyName;

    @Column(name = "company_website", length = 500)
    private String companyWebsite;

    @Column(name = "company_domain", length = 255)
    private String companyDomain;

    @Column(name = "industry", length = 150)
    private String industry;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "work_email", length = 320)
    private String workEmail;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "email_status", nullable = false, length = 30)
    private String emailStatus;

    @Column(name = "email_verification_confidence")
    private Double emailVerificationConfidence;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    @Column(name = "source", length = 100)
    private String source;

    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "is_decision_maker")
    private Boolean isDecisionMaker;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "last_discovered_at")
    private Instant lastDiscoveredAt;

    @Column(name = "discovery_source", length = 100)
    private String discoverySource;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public EmployeeLead() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getSeniority() {
        return seniority;
    }

    public void setSeniority(String seniority) {
        this.seniority = seniority;
    }

    public String getProfessionalUrl() {
        return professionalUrl;
    }

    public void setProfessionalUrl(String professionalUrl) {
        this.professionalUrl = professionalUrl;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getCompanyWebsite() {
        return companyWebsite;
    }

    public void setCompanyWebsite(String companyWebsite) {
        this.companyWebsite = companyWebsite;
    }

    public String getCompanyDomain() {
        return companyDomain;
    }

    public void setCompanyDomain(String companyDomain) {
        this.companyDomain = companyDomain;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getWorkEmail() {
        return workEmail;
    }

    public void setWorkEmail(String workEmail) {
        this.workEmail = workEmail;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmailStatus() {
        return emailStatus;
    }

    public void setEmailStatus(String emailStatus) {
        this.emailStatus = emailStatus;
    }

    public Double getEmailVerificationConfidence() {
        return emailVerificationConfidence;
    }

    public void setEmailVerificationConfidence(
            Double emailVerificationConfidence) {
        this.emailVerificationConfidence = emailVerificationConfidence;
    }

    public Instant getEmailVerifiedAt() {
        return emailVerifiedAt;
    }

    public void setEmailVerifiedAt(Instant emailVerifiedAt) {
        this.emailVerifiedAt = emailVerifiedAt;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Boolean getIsDecisionMaker() {
        return isDecisionMaker;
    }

    public void setIsDecisionMaker(Boolean isDecisionMaker) {
        this.isDecisionMaker = isDecisionMaker;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastDiscoveredAt() {
        return lastDiscoveredAt;
    }

    public void setLastDiscoveredAt(Instant lastDiscoveredAt) {
        this.lastDiscoveredAt = lastDiscoveredAt;
    }

    public String getDiscoverySource() {
        return discoverySource;
    }

    public void setDiscoverySource(String discoverySource) {
        this.discoverySource = discoverySource;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}