package com.leadscraper.backend.repository;

import com.leadscraper.backend.entity.UsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UsageLogRepository extends JpaRepository<UsageLog, UUID> {
    List<UsageLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    @Query("SELECT COALESCE(SUM(u.count), 0) FROM UsageLog u WHERE u.userId = :userId AND u.actionType = :actionType")
    long sumCountByUserIdAndActionType(@Param("userId") UUID userId, @Param("actionType") String actionType);
}
