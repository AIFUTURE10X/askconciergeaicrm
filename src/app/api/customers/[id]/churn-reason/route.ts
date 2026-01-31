import { NextRequest, NextResponse } from "next/server";
import { logChurnReason, CHURN_REASONS } from "@/lib/admin/renewal-queries";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reason, details } = body;

    if (!reason || !CHURN_REASONS.includes(reason)) {
      return NextResponse.json(
        { message: "Invalid churn reason" },
        { status: 400 }
      );
    }

    await logChurnReason(id, reason, details);

    return NextResponse.json({ message: "Churn reason logged" });
  } catch (error) {
    console.error("Error logging churn reason:", error);
    return NextResponse.json(
      { message: "Failed to log churn reason" },
      { status: 500 }
    );
  }
}
