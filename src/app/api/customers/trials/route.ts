import { NextResponse } from "next/server";
import { getTrialOnboardingData } from "@/lib/admin/health-queries";

export async function GET() {
  try {
    const trials = await getTrialOnboardingData();

    // Sort by days remaining (most urgent first)
    trials.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const stats = {
      activeTrials: trials.length,
      stalledCount: trials.filter((t) => t.lastActivityDaysAgo === null || t.lastActivityDaysAgo >= 7).length,
      avgMilestones: trials.length > 0
        ? Math.round((trials.reduce((sum, t) => sum + t.milestonesCompleted, 0) / trials.length) * 10) / 10
        : 0,
      urgentCount: trials.filter((t) => t.daysRemaining <= 7 && t.milestonesCompleted < 3).length,
    };

    return NextResponse.json({ trials, stats });
  } catch (error) {
    console.error("Error fetching trial data:", error);
    return NextResponse.json(
      { message: "Failed to fetch trial data" },
      { status: 500 }
    );
  }
}
