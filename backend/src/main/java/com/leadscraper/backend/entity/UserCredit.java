package com.leadscraper.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_credits")
public class UserCredit {

    @Id
    @UuidGenerator
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "total_credits", nullable = false)
    private Integer totalCredits;

    @Column(name = "used_credits", nullable = false)
    private Integer usedCredits;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UserCredit() {
    }

    public UserCredit(UUID userId, Integer totalCredits, Integer usedCredits) {
        this.userId = userId;
        this.totalCredits = totalCredits;
        this.usedCredits = usedCredits;
        this.updatedAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public Integer getTotalCredits() {
        return totalCredits;
    }

    public void setTotalCredits(Integer totalCredits) {
        this.totalCredits = totalCredits;
    }

    public Integer getUsedCredits() {
        return usedCredits;
    }

    public void setUsedCredits(Integer usedCredits) {
        this.usedCredits = usedCredits;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public int getRemainingCredits() {
        return Math.max(0, (totalCredits != null ? totalCredits : 1000) - (usedCredits != null ? usedCredits : 0));
    }
}
