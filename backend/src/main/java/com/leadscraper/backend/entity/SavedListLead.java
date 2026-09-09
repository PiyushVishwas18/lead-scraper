package com.leadscraper.backend.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "saved_list_leads")
public class SavedListLead {

    @EmbeddedId
    private SavedListLeadId id;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public SavedListLead() {
    }

    public SavedListLead(SavedListLeadId id) {
        this.id = id;
        this.createdAt = Instant.now();
    }

    public SavedListLeadId getId() {
        return id;
    }

    public void setId(SavedListLeadId id) {
        this.id = id;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
