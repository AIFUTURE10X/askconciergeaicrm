import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { getStage, getTier } from "@/lib/constants/pipeline";
import type { Deal } from "@/lib/db/schema";

interface ContactDealsCardProps {
  deals: Deal[];
  contactId: string;
}

export function ContactDealsCard({ deals, contactId }: ContactDealsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Deals</CardTitle>
        <Button size="sm" asChild>
          <Link href={`/pipeline?contactId=${contactId}`}>
            <Plus className="h-4 w-4 mr-1" />
            Add Deal
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {deals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No deals yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => {
              const stage = getStage(deal.stage);
              const tier = deal.tier ? getTier(deal.tier) : null;
              return (
                <div
                  key={deal.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{deal.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {stage && (
                        <Badge variant="secondary" className={`text-xs ${stage.color}`}>
                          {stage.label}
                        </Badge>
                      )}
                      {tier && (
                        <span className="text-xs text-muted-foreground">{tier.label}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {deal.value && (
                      <div className="font-medium">
                        ${parseFloat(deal.value).toLocaleString()}
                      </div>
                    )}
                    {deal.expectedCloseDate && (
                      <div className="text-xs text-muted-foreground">
                        Close: {format(new Date(deal.expectedCloseDate), "MMM d")}
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
