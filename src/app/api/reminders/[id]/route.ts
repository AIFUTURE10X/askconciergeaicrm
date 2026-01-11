import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reminders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH - Update/complete reminder
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingReminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, id),
    });

    if (!existingReminder) {
      return NextResponse.json(
        { message: "Reminder not found" },
        { status: 404 }
      );
    }

    const { title, description, dueAt, priority, isCompleted } = body;

    const updateData: Partial<typeof reminders.$inferInsert> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueAt !== undefined) updateData.dueAt = new Date(dueAt);
    if (priority !== undefined) updateData.priority = priority;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
    }

    const [updatedReminder] = await db
      .update(reminders)
      .set(updateData)
      .where(eq(reminders.id, id))
      .returning();

    return NextResponse.json({
      reminder: updatedReminder,
      message: isCompleted
        ? "Reminder completed"
        : "Reminder updated successfully",
    });
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { message: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

// DELETE - Delete reminder
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const existingReminder = await db.query.reminders.findFirst({
      where: eq(reminders.id, id),
    });

    if (!existingReminder) {
      return NextResponse.json(
        { message: "Reminder not found" },
        { status: 404 }
      );
    }

    await db.delete(reminders).where(eq(reminders.id, id));

    return NextResponse.json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { message: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
