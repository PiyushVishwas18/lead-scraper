ALTER TABLE employee_leads
    ADD COLUMN last_discovered_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE employee_leads
    ADD COLUMN discovery_source VARCHAR(100);
