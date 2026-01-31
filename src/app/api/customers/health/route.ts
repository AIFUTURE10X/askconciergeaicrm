import { NextRequest, NextResponse } from "next/server";
import { getAllCustomerHealth } from "@/lib/admin/health-queries";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const category = params.get("category") || undefined;
    const tier = params.get("tier") || undefined;
    const sort = params.get("sort") || "score";
    const order = (params.get("order") || "asc") as "asc" | "desc";

    const { customers, stats } = await getAllCustomerHealth({
      category,
      tier,
      sort,
      order,
    });

    return NextResponse.json({ customers, stats });
  } catch (error) {
    console.error("Error fetching health data:", error);
    return NextResponse.json(
      { message: "Failed to fetch health data" },
      { status: 500 }
    );
  }
}
