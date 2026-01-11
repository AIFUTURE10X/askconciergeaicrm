import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('Creating email_drafts table...');

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS email_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        processed_email_id UUID REFERENCES processed_emails(id) ON DELETE CASCADE,
        original_from_email VARCHAR(255) NOT NULL,
        original_from_name VARCHAR(255),
        original_subject VARCHAR(500),
        original_body TEXT,
        original_received_at TIMESTAMP,
        gmail_thread_id VARCHAR(255),
        gmail_message_id VARCHAR(255),
        draft_subject VARCHAR(500),
        draft_body TEXT NOT NULL,
        tone VARCHAR(50) NOT NULL DEFAULT 'professional',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        contact_id UUID REFERENCES contacts(id),
        deal_id UUID REFERENCES deals(id),
        sent_at TIMESTAMP,
        sent_gmail_message_id VARCHAR(255),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log('✓ Created email_drafts table');

    await sql`CREATE INDEX IF NOT EXISTS email_drafts_status_idx ON email_drafts(status)`;
    console.log('✓ Created status index');

    await sql`CREATE INDEX IF NOT EXISTS email_drafts_contact_idx ON email_drafts(contact_id)`;
    console.log('✓ Created contact index');

    await sql`CREATE INDEX IF NOT EXISTS email_drafts_deal_idx ON email_drafts(deal_id)`;
    console.log('✓ Created deal index');

    await sql`CREATE INDEX IF NOT EXISTS email_drafts_created_idx ON email_drafts(created_at DESC)`;
    console.log('✓ Created created_at index');

    console.log('\nMigration complete!');
  } catch (error) {
    console.error('Migration error:', error.message);
  }
}

runMigration().catch(console.error);
