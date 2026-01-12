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
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm">Deal Summary</CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-lg font-bold">{deals.length}</div>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{activeDeals.length}</div>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{wonDeals.length}</div>
            <p className="text-[10px] text-muted-foreground">Won</p>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
              {totalDealValue.toLocaleString()}
            </div>
            <p className="text-[10px] text-muted-foreground">Value</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
