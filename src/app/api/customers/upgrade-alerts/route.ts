import { NextResponse } from "next/server";
import { getUpgradeOpportunities } from "@/lib/admin/upgrade-queries";

export async function GET() {
  try {
    const { opportunities, stats } = await getUpgradeOpportunities();

    return NextResponse.json({ opportunities, stats });
  } catch (error) {
    console.error("Error fetching upgrade alerts:", error);
    return NextResponse.json(
      { message: "Failed to fetch upgrade alerts" },
      { status: 500 }
    );
  }
}
