"use client";

import { Card } from "@/components/ui/card";
import { BarChart3, MessageSquare, Database, HelpCircle, Search, Cpu } from "lucide-react";
import { TIER_LIMITS } from "@/lib/admin/constants";
import type { AdminOrgDetail, AdminOrgUsage } from "@/lib/admin/types";

interface Props {
  org: AdminOrgDetail;
  usage: AdminOrgUsage[];
}

export function CustomerUsageTab({ org, usage }: Props) {
  const tier = org.pricingTier || "ruby";
  const messageLimit = TIER_LIMITS[tier]?.messages || 1000;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentUsage = usage.find((u) => u.month === currentMonth);
  const pastUsage = usage.filter((u) => u.month !== currentMonth);

  return (
    <div className="space-y-4">
      {/* Current month */}
      <Card className="p-4 space-y-3">
        <h3 className="font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Current Month ({currentMonth})
        </h3>
        {currentUsage ? (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>AI Messages</span>
                <span className="font-medium">
                  {(currentUsage.messagesUsed || 0).toLocaleString()} / {messageLimit.toLocaleString()}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${Math.min(100, ((currentUsage.messagesUsed || 0) / messageLimit) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(((currentUsage.messagesUsed || 0) / messageLimit) * 100)}% used
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <BreakdownItem
                icon={MessageSquare}
                label="AI Messages"
                value={currentUsage.messagesUsed || 0}
              />
              <BreakdownItem
                icon={Database}
                label="Cached"
                value={currentUsage.messagesCached || 0}
              />
              <BreakdownItem
                icon={HelpCircle}
                label="FAQ Matched"
                value={currentUsage.messagesFaqMatched || 0}
              />
              <BreakdownItem
                icon={Search}
                label="Direct Lookup"
                value={currentUsage.messagesDirectLookup || 0}
              />
            </div>

            {/* Tokens */}
            <div className="flex gap-4 pt-2 border-t text-sm">
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Input tokens:</span>
                <span>{(currentUsage.tokensInput || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Cpu className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Output tokens:</span>
                <span>{(currentUsage.tokensOutput || 0).toLocaleString()}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No usage this month</p>
        )}
      </Card>

      {/* Monthly history */}
      {pastUsage.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium">Monthly History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Month</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Messages</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cached</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">FAQ</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Tokens In</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Tokens Out</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pastUsage.map((u) => (
                  <tr key={u.month}>
                    <td className="px-3 py-2">{u.month}</td>
                    <td className="px-3 py-2 text-right">{(u.messagesUsed || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{(u.messagesCached || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{(u.messagesFaqMatched || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{(u.tokensInput || 0).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{(u.tokensOutput || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function BreakdownItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value.toLocaleString()}</span>
    </div>
  );
}
