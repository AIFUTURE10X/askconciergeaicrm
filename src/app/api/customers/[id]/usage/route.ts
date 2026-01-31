import { NextRequest, NextResponse } from "next/server";
import { getOrganizationUsage } from "@/lib/admin/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usage = await getOrganizationUsage(id);
    return NextResponse.json({ usage });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { message: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
