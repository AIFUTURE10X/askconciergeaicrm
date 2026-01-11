-- Settings table for storing Gmail OAuth tokens
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Processed emails to track what's already synced
CREATE TABLE IF NOT EXISTS processed_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id VARCHAR(255) NOT NULL UNIQUE,
  from_email VARCHAR(255),
  subject VARCHAR(500),
  processed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id)
);

CREATE INDEX IF NOT EXISTS processed_emails_gmail_id_idx ON processed_emails(gmail_message_id);
CREATE INDEX IF NOT EXISTS processed_emails_from_idx ON processed_emails(from_email);
