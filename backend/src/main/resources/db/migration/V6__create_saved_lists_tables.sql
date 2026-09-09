CREATE TABLE saved_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_lists_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE saved_list_leads (
    list_id UUID NOT NULL,
    lead_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_saved_list_leads
        PRIMARY KEY (list_id, lead_id),

    CONSTRAINT fk_saved_list_leads_list
        FOREIGN KEY (list_id)
        REFERENCES saved_lists(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_saved_list_leads_lead
        FOREIGN KEY (lead_id)
        REFERENCES employee_leads(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_saved_lists_owner
    ON saved_lists(owner_id);

CREATE INDEX idx_saved_list_leads_lead
    ON saved_list_leads(lead_id);
