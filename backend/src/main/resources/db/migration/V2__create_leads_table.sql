CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID NOT NULL,

    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(320),
    phone VARCHAR(50),

    website VARCHAR(500),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),

    source VARCHAR(100),
    source_url VARCHAR(1000),

    status VARCHAR(30) NOT NULL DEFAULT 'NEW',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_leads_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_leads_status
        CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'REJECTED'))
);

CREATE INDEX idx_leads_owner_id
    ON leads(owner_id);

CREATE INDEX idx_leads_email
    ON leads(email);

CREATE INDEX idx_leads_status
    ON leads(status);