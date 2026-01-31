import { NextResponse } from "next/server";
import { getRenewalPipelineData, getRecentChurns } from "@/lib/admin/renewal-queries";

export async function GET() {
  try {
    const [pipeline, recentChurns] = await Promise.all([
      getRenewalPipelineData(),
      getRecentChurns(),
    ]);

    return NextResponse.json({
      customers: pipeline.customers,
      stats: pipeline.stats,
      recentChurns,
    });
  } catch (error) {
    console.error("Error fetching renewal data:", error);
    return NextResponse.json(
      { message: "Failed to fetch renewal data" },
      { status: 500 }
    );
  }
}
