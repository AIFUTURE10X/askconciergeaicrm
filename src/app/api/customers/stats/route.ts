import { NextResponse } from "next/server";
import { getAdminStats } from "@/lib/admin/queries";

export async function GET() {
  try {
    const stats = await getAdminStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching customer stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
