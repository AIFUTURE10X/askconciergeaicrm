import { NextRequest, NextResponse } from "next/server";
import { getSingleCustomerHealth } from "@/lib/admin/health-queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const health = await getSingleCustomerHealth(id);

    if (!health) {
      return NextResponse.json(
        { message: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ health });
  } catch (error) {
    console.error("Error fetching customer health:", error);
    return NextResponse.json(
      { message: "Failed to fetch health data" },
      { status: 500 }
    );
  }
}
