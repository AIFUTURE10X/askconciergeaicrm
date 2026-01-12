/**
 * Manual Gmail Sync Endpoint
 *
 * Syncs emails from all connected Gmail accounts.
 * Allows triggering from the settings page.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  contacts,
  deals,
  activities,
  processedEmails,
  emailDrafts,
} from "@/lib/db/schema";
import { eq, ilike } from "drizzle-orm";
import {
  getAllGmailAccounts,
  fetchEmailsFromAccount,
  markAsReadForAccount,
  addLabelForAccount,
  updateLastSyncTime,
  migrateLegacyTokens,
} from "@/lib/gmail/client";
import { generateEmailDraft } from "@/lib/ai/email-drafter";
import type { GmailAccount } from "@/lib/db/schema";

export async function POST() {
  console.log("[Gmail Manual Sync] Starting sync...");

  // Try to migrate legacy tokens first
  try {
    await migrateLegacyTokens();
  } catch (err) {
    console.log("[Gmail Manual Sync] Legacy migration skipped:", err);
  }

  // Get all connected accounts
  const accounts = await getAllGmailAccounts();

  if (accounts.length === 0) {
    console.log("[Gmail Manual Sync] No Gmail accounts connected");
    return NextResponse.json({
      success: false,
      message: "Gmail not connected",
    });
  }

  console.log(`[Gmail Manual Sync] Found ${accounts.length} connected account(s)`);

  let totalProcessed = 0;
  let totalSkipped = 0;
  const accountResults: Array<{
    email: string;
    processed: number;
    skipped: number;
    error?: string;
  }> = [];

  // Process each account
  for (const account of accounts) {
    try {
      const result = await syncAccount(account);
      accountResults.push({
        email: account.email,
        processed: result.processed,
        skipped: result.skipped,
      });
      totalProcessed += result.processed;
      totalSkipped += result.skipped;

      // Update last sync time
      await updateLastSyncTime(account.id);
    } catch (error) {
      console.error(`[Gmail Manual Sync] Error syncing ${account.email}:`, error);
      accountResults.push({
        email: account.email,
        processed: 0,
        skipped: 0,
        error: String(error),
      });
    }
  }

  console.log(`[Gmail Manual Sync] Complete: ${totalProcessed} processed, ${totalSkipped} skipped`);

  return NextResponse.json({
    success: true,
    processed: totalProcessed,
    skipped: totalSkipped,
    accounts: accountResults,
  });
}

async function syncAccount(account: GmailAccount): Promise<{
  processed: number;
  skipped: number;
}> {
  // Fetch recent emails (including read ones) from last 7 days
  const emails = await fetchEmailsFromAccount(account, {
    maxResults: 50,
    onlyUnread: false,
    newerThanDays: 7,
  });

  console.log(`[Gmail Manual Sync] [${account.email}] Found ${emails.length} emails`);

  let processed = 0;
  let skipped = 0;

  for (const email of emails) {
    // Check if already processed
    const existing = await db.query.processedEmails.findFirst({
      where: eq(processedEmails.gmailMessageId, email.id),
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Skip no-reply emails
    if (isNoReplyEmail(email.fromEmail)) {
      await markAsReadForAccount(account, email.id);
      await db.insert(processedEmails).values({
        gmailAccountId: account.id,
        gmailMessageId: email.id,
        fromEmail: email.fromEmail,
        subject: email.subject,
      });
      skipped++;
      continue;
    }

    // Find or create contact
    let contact = await db.query.contacts.findFirst({
      where: ilike(contacts.email, email.fromEmail.toLowerCase()),
    });

    if (!contact) {
      const [newContact] = await db
        .insert(contacts)
        .values({
          name: email.fromName || email.fromEmail.split("@")[0],
          email: email.fromEmail.toLowerCase(),
          source: "inbound",
          notes: `First contact via email: ${email.subject}`,
        })
        .returning();

      contact = newContact;
      console.log(`[Gmail Manual Sync] [${account.email}] Created contact: ${contact.email}`);
    }

    // Create deal with business account reference
    const [deal] = await db
      .insert(deals)
      .values({
        contactId: contact.id,
        gmailAccountId: account.id,
        title: `${email.fromName || email.fromEmail} - Email Inquiry`,
        stage: "lead",
        probability: 10,
        leadSource: "cold_email",
        nextStep: "Qualify lead - respond to email",
        followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        notes: `Via: ${account.name || account.email}\n\nSubject: ${email.subject}\n\n${email.body.substring(0, 1000)}`,
      })
      .returning();

    console.log(`[Gmail Manual Sync] [${account.email}] Created deal: ${deal.id}`);

    // Log activity
    await db.insert(activities).values({
      dealId: deal.id,
      contactId: contact.id,
      type: "email",
      subject: `Inbound Email: ${email.subject}`,
      description: email.body.substring(0, 2000),
      outcome: "completed",
      completedAt: email.date,
    });

    // Record as processed
    const [processedEmail] = await db
      .insert(processedEmails)
      .values({
        gmailAccountId: account.id,
        gmailMessageId: email.id,
        fromEmail: email.fromEmail,
        subject: email.subject,
        contactId: contact.id,
        dealId: deal.id,
      })
      .returning();

    // Generate AI draft
    try {
      const draftResult = await generateEmailDraft({
        fromName: email.fromName || email.fromEmail.split("@")[0],
        fromEmail: email.fromEmail,
        subject: email.subject || "",
        body: email.body,
        contactName: contact.name,
        companyName: contact.company || undefined,
        dealTitle: deal.title,
        dealStage: deal.stage,
      });

      await db.insert(emailDrafts).values({
        processedEmailId: processedEmail.id,
        gmailAccountId: account.id,
        originalFromEmail: email.fromEmail,
        originalFromName: email.fromName,
        originalSubject: email.subject,
        originalBody: email.body,
        originalReceivedAt: email.date,
        gmailThreadId: email.threadId,
        gmailMessageId: email.id,
        draftSubject: draftResult.subject,
        draftBody: draftResult.body,
        tone: "professional",
        status: "pending",
        contactId: contact.id,
        dealId: deal.id,
      });

      console.log(`[Gmail Manual Sync] [${account.email}] AI draft created`);
    } catch (aiError) {
      console.error(`[Gmail Manual Sync] [${account.email}] AI draft failed:`, aiError);
    }

    // Mark as read and label
    await markAsReadForAccount(account, email.id);
    try {
      await addLabelForAccount(account, email.id, "CRM-Imported");
    } catch {
      // Label might fail, not critical
    }

    processed++;
  }

  return { processed, skipped };
}

function isNoReplyEmail(email: string): boolean {
  const noReplyPatterns = [
    "noreply",
    "no-reply",
    "donotreply",
    "do-not-reply",
    "mailer-daemon",
    "postmaster",
    "notifications",
    "alert",
    "system",
    "automated",
  ];

  const lowerEmail = email.toLowerCase();
  return noReplyPatterns.some((pattern) => lowerEmail.includes(pattern));
}
