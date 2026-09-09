package com.leadscraper.backend.service;

import com.leadscraper.backend.dto.lead.UsageStatsResponse;
import com.leadscraper.backend.entity.UsageLog;
import com.leadscraper.backend.entity.UserCredit;
import com.leadscraper.backend.repository.SavedListRepository;
import com.leadscraper.backend.repository.UsageLogRepository;
import com.leadscraper.backend.repository.UserCreditRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class CreditAndUsageService {

    private final UserCreditRepository userCreditRepository;
    private final UsageLogRepository usageLogRepository;
    private final SavedListRepository savedListRepository;

    public CreditAndUsageService(
            UserCreditRepository userCreditRepository,
            UsageLogRepository usageLogRepository,
            SavedListRepository savedListRepository) {
        this.userCreditRepository = userCreditRepository;
        this.usageLogRepository = usageLogRepository;
        this.savedListRepository = savedListRepository;
    }

    @Transactional
    public UserCredit getOrCreateUserCredit(UUID userId) {
        return userCreditRepository.findByUserId(userId)
                .orElseGet(() -> userCreditRepository.save(new UserCredit(userId, 1000, 0)));
    }

    @Transactional
    public boolean deductCredits(UUID userId, int creditsToDeduct) {
        UserCredit userCredit = getOrCreateUserCredit(userId);
        if (userCredit.getRemainingCredits() < creditsToDeduct) {
            return false;
        }
        userCredit.setUsedCredits(userCredit.getUsedCredits() + creditsToDeduct);
        userCredit.setUpdatedAt(Instant.now());
        userCreditRepository.save(userCredit);
        return true;
    }

    @Transactional
    public void logUsage(UUID userId, String actionType, int count) {
        if (userId == null || actionType == null || actionType.isBlank()) return;
        usageLogRepository.save(new UsageLog(userId, actionType, count > 0 ? count : 1));
    }

    @Transactional(readOnly = true)
    public UsageStatsResponse getUsageStats(UUID userId) {
        UserCredit userCredit = getOrCreateUserCredit(userId);

        long searched = usageLogRepository.sumCountByUserIdAndActionType(userId, "PEOPLE_SEARCH")
                + usageLogRepository.sumCountByUserIdAndActionType(userId, "COMPANY_SEARCH");
        long discovered = usageLogRepository.sumCountByUserIdAndActionType(userId, "EMPLOYEE_DISCOVERY");
        long saved = usageLogRepository.sumCountByUserIdAndActionType(userId, "LEAD_SAVED");
        long emailsFound = usageLogRepository.sumCountByUserIdAndActionType(userId, "EMAIL_FOUND");
        long emailsVerified = usageLogRepository.sumCountByUserIdAndActionType(userId, "EMAIL_VERIFIED");
        long contactsRevealed = usageLogRepository.sumCountByUserIdAndActionType(userId, "CONTACT_REVEALED");
        long listsCreated = savedListRepository.findByOwnerIdOrderByCreatedAtDesc(userId).size();

        return new UsageStatsResponse(
                searched,
                discovered,
                saved,
                emailsFound,
                emailsVerified,
                contactsRevealed,
                listsCreated,
                userCredit.getRemainingCredits(),
                userCredit.getTotalCredits()
        );
    }
}
