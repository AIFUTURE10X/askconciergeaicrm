import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import type { Deal } from "@/lib/db/schema";

interface DealSummaryCardProps {
  deals: Deal[];
}

export function DealSummaryCard({ deals }: DealSummaryCardProps) {
  const activeDeals = deals.filter(
    (d) => d.stage !== "closed_won" && d.stage !== "closed_lost"
  );
  const wonDeals = deals.filter((d) => d.stage === "closed_won");
  const totalDealValue = deals.reduce(
    (sum, d) => sum + (d.value ? parseFloat(d.value) : 0),
    0
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Deal Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground">Total Deals</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{activeDeals.length}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div>
            <div className="text-2xl font-bold">{wonDeals.length}</div>
            <p className="text-xs text-muted-foreground">Won</p>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center">
              <DollarSign className="h-5 w-5" />
              {totalDealValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total Value</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
