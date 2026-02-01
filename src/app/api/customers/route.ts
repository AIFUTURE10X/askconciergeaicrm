import { NextRequest, NextResponse } from "next/server";
import { listOrganizations } from "@/lib/admin/queries";

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const filters = {
      search: params.get("search") || undefined,
      tier: params.get("tier") || undefined,
      status: params.get("status") || undefined,
      sort: params.get("sort") || undefined,
      order: (params.get("order") as "asc" | "desc") || undefined,
      page: params.get("page") ? parseInt(params.get("page")!) : undefined,
      limit: params.get("limit") ? parseInt(params.get("limit")!) : undefined,
      dateFrom: params.get("dateFrom") || undefined,
      dateTo: params.get("dateTo") || undefined,
      hasCrmAddon: params.get("hasCrmAddon") === "true" || undefined,
    };

    const result = await listOrganizations(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { message: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
