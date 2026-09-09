package com.leadscraper.backend.entity;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class SavedListLeadId implements Serializable {

    private UUID listId;
    private UUID leadId;

    public SavedListLeadId() {
    }

    public SavedListLeadId(UUID listId, UUID leadId) {
        this.listId = listId;
        this.leadId = leadId;
    }

    public UUID getListId() {
        return listId;
    }

    public void setListId(UUID listId) {
        this.listId = listId;
    }

    public UUID getLeadId() {
        return leadId;
    }

    public void setLeadId(UUID leadId) {
        this.leadId = leadId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SavedListLeadId that = (SavedListLeadId) o;
        return Objects.equals(listId, that.listId) && Objects.equals(leadId, that.leadId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(listId, leadId);
    }
}
