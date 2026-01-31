import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema/main-app-tables";
import { inArray, sql } from "drizzle-orm";

// POST /api/customers/bulk-delete - Delete multiple organizations (cascades all child data)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationIds } = body;

    if (
      !organizationIds ||
      !Array.isArray(organizationIds) ||
      organizationIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Organization IDs are required" },
        { status: 400 }
      );
    }

    // Validate all IDs are valid UUIDs
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organizationIds.every((id: string) => uuidRegex.test(id))) {
      return NextResponse.json(
        { error: "Invalid organization ID format" },
        { status: 400 }
      );
    }

    // Delete impersonation audit logs first — that table has a NOT NULL org FK
    // with onDelete: "set null" (schema bug), which blocks cascade deletes
    const idParams = organizationIds.map((id: string) => sql`${id}::uuid`);
    await db.execute(
      sql`DELETE FROM impersonation_audit_log WHERE target_organization_id IN (${sql.join(idParams, sql`, `)})`
    );

    const deleted = await db
      .delete(organizations)
      .where(inArray(organizations.id, organizationIds))
      .returning({ id: organizations.id });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.length,
    });
  } catch (error) {
    console.error("Error bulk deleting organizations:", error);
    return NextResponse.json(
      { error: "Failed to delete organizations" },
      { status: 500 }
    );
  }
}
