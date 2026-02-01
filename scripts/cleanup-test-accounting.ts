/**
 * Cleanup script: Removes all test organizations and associated data
 * created by seed-test-accounting.ts.
 *
 * Usage: npm run seed:cleanup
 *
 * Identifies test data by:
 * - Organizations with names starting with "TEST - "
 * - Users with emails matching "test-*@test.askconcierge.ai"
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, like, inArray } from "drizzle-orm";
import {
  organizations,
  users,
  organizationMembers,
  aiUsage,
  crmSubscriptions,
} from "../src/lib/db/schema/main-app-tables";
import { churnReasons } from "../src/lib/db/schema/tables";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Make sure .env.local is loaded.");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log("Cleaning up test accounting data...\n");

  // 1. Find all TEST organizations
  const testOrgs = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(like(organizations.name, "TEST - %"));

  if (testOrgs.length === 0) {
    console.log("No test organizations found. Nothing to clean up.");
    return;
  }

  console.log(`Found ${testOrgs.length} test organizations to remove.\n`);

  const orgIds = testOrgs.map((o) => o.id);
  const counts = {
    churnReasons: 0,
    aiUsage: 0,
    crmSubs: 0,
    members: 0,
    orgs: 0,
    users: 0,
  };

  // 2. Delete churn reasons
  for (const orgId of orgIds) {
    const result = await db
      .delete(churnReasons)
      .where(eq(churnReasons.organizationId, orgId))
      .returning();
    counts.churnReasons += result.length;
  }

  // 3. Delete AI usage records
  for (const orgId of orgIds) {
    const result = await db
      .delete(aiUsage)
      .where(eq(aiUsage.organizationId, orgId))
      .returning();
    counts.aiUsage += result.length;
  }

  // 4. Delete CRM subscriptions
  for (const orgId of orgIds) {
    const result = await db
      .delete(crmSubscriptions)
      .where(eq(crmSubscriptions.organizationId, orgId))
      .returning();
    counts.crmSubs += result.length;
  }

  // 5. Get member user IDs before deleting members
  const memberRows = await db
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .where(inArray(organizationMembers.organizationId, orgIds));
  const userIds = memberRows.map((m) => m.userId);

  // 6. Delete organization members
  for (const orgId of orgIds) {
    const result = await db
      .delete(organizationMembers)
      .where(eq(organizationMembers.organizationId, orgId))
      .returning();
    counts.members += result.length;
  }

  // 7. Delete organizations
  for (const orgId of orgIds) {
    await db.delete(organizations).where(eq(organizations.id, orgId));
    counts.orgs++;
  }

  // 8. Delete test users (by email pattern as a safety check)
  for (const userId of userIds) {
    const result = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    // Only count if the user actually had a test email
    if (
      result.length > 0 &&
      result[0].email.endsWith("@test.askconcierge.ai")
    ) {
      counts.users++;
    }
  }

  console.log("--- Deleted ---");
  console.log(`  Organizations:     ${counts.orgs}`);
  console.log(`  Users:             ${counts.users}`);
  console.log(`  Members:           ${counts.members}`);
  console.log(`  AI Usage rows:     ${counts.aiUsage}`);
  console.log(`  CRM Subscriptions: ${counts.crmSubs}`);
  console.log(`  Churn Reasons:     ${counts.churnReasons}`);
  console.log("\nCleanup complete.");
}

main().catch((err) => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
