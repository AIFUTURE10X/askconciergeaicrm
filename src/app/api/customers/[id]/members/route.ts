import { NextRequest, NextResponse } from "next/server";
import { getOrganizationMembers } from "@/lib/admin/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const members = await getOrganizationMembers(id);

    // Reshape for frontend
    const result = members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      jobTitle: m.jobTitle,
      createdAt: m.createdAt,
      user: {
        name: m.userName,
        email: m.userEmail,
        image: m.userImage,
      },
    }));

    return NextResponse.json({ members: result });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { message: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
