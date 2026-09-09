CREATE TABLE employee_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID NOT NULL,

    -- Employee information
    full_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    job_title VARCHAR(255),
    department VARCHAR(150),
    seniority VARCHAR(100),
    professional_url VARCHAR(1000),

    -- Company information
    company_name VARCHAR(255) NOT NULL,
    company_website VARCHAR(500),
    company_domain VARCHAR(255),
    industry VARCHAR(150),

    -- Location
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),

    -- Contact information
    work_email VARCHAR(320),
    phone VARCHAR(50),

    -- Email verification
    email_status VARCHAR(30) NOT NULL DEFAULT 'NOT_CHECKED',
    email_verification_confidence DOUBLE PRECISION,
    email_verified_at TIMESTAMPTZ,

    -- Source information
    source VARCHAR(100),
    source_url VARCHAR(1000),
    confidence DOUBLE PRECISION,

    -- CRM
    status VARCHAR(30) NOT NULL DEFAULT 'NEW',

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_employee_leads_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_employee_leads_email_status
        CHECK (
            email_status IN (
                'NOT_CHECKED',
                'VALID',
                'INVALID',
                'UNKNOWN'
            )
        ),

    CONSTRAINT ck_employee_leads_status
        CHECK (
            status IN (
                'NEW',
                'CONTACTED',
                'QUALIFIED',
                'CONVERTED',
                'REJECTED'
            )
        )
);

CREATE INDEX idx_employee_leads_owner_id
    ON employee_leads(owner_id);

CREATE INDEX idx_employee_leads_email
    ON employee_leads(work_email);

CREATE INDEX idx_employee_leads_company
    ON employee_leads(company_name);

CREATE INDEX idx_employee_leads_status
    ON employee_leads(status);

CREATE INDEX idx_employee_leads_email_status
    ON employee_leads(email_status);