package com.leadscraper.backend.dto.lead;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import java.util.UUID;

public record AddLeadsToListRequest(
        @NotEmpty List<UUID> leadIds
) {
}
