"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CHURN_REASON_LABELS } from "@/lib/admin/renewal-constants";
import type { ChurnRecord } from "@/lib/admin/renewal-queries";

interface Props {
  churns: ChurnRecord[];
}

export function RecentChurnList({ churns }: Props) {
  if (churns.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-medium mb-2">Recent Churns</h3>
        <p className="text-sm text-muted-foreground">No churns recorded</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium mb-3">Recent Churns</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Reason</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Health at Churn</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {churns.map((churn) => (
              <tr key={churn.id} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <Link href={`/customers/${churn.orgId}`} className="font-medium hover:underline">
                    {churn.orgName}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {CHURN_REASON_LABELS[churn.reason] || churn.reason}
                  </Badge>
                  {churn.details && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">
                      {churn.details}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {churn.healthScoreAtChurn !== null ? churn.healthScoreAtChurn : "N/A"}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(churn.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
