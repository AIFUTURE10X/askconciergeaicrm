import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { getStage, getTier } from "@/lib/constants/pipeline";
import type { Deal } from "@/lib/db/schema";

interface ContactDealsCardProps {
  deals: Deal[];
  onAddDeal: () => void;
}

export function ContactDealsCard({ deals, onAddDeal }: ContactDealsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-2 px-3">
        <CardTitle className="text-sm">Deals</CardTitle>
        <Button size="sm" className="h-6 text-xs" onClick={onAddDeal}>
          <Plus className="h-3 w-3 mr-1" />
          Add Deal
        </Button>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0">
        {deals.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Building2 className="h-6 w-6 mx-auto mb-1 opacity-50" />
            <p className="text-xs">No deals yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {deals.map((deal) => {
              const stage = getStage(deal.stage);
              const tier = deal.tier ? getTier(deal.tier) : null;
              return (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{deal.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {stage && (
                        <Badge variant="secondary" className={`text-[10px] px-1 py-0 ${stage.color}`}>
                          {stage.label}
                        </Badge>
                      )}
                      {tier && (
                        <span className="text-[10px] text-muted-foreground">{tier.label}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {deal.value && (
                      <div className="text-xs font-medium">
                        ${parseFloat(deal.value).toLocaleString()}
                      </div>
                    )}
                    {deal.expectedCloseDate && (
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(deal.expectedCloseDate), "MMM d")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
