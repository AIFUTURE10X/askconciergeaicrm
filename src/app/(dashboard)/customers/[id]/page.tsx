"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminOrgDetail, AdminOrgMember, AdminOrgUsage } from "@/lib/admin/types";
import { CustomerOverviewTab } from "@/components/customers/tabs/CustomerOverviewTab";
import { CustomerSubscriptionTab } from "@/components/customers/tabs/CustomerSubscriptionTab";
import { CustomerUsageTab } from "@/components/customers/tabs/CustomerUsageTab";
import { CustomerMembersTab } from "@/components/customers/tabs/CustomerMembersTab";
import { CustomerActionsTab } from "@/components/customers/tabs/CustomerActionsTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "subscription", label: "Subscription" },
  { id: "usage", label: "Usage" },
  { id: "members", label: "Members" },
  { id: "actions", label: "Actions" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [org, setOrg] = useState<AdminOrgDetail | null>(null);
  const [members, setMembers] = useState<AdminOrgMember[]>([]);
  const [usage, setUsage] = useState<AdminOrgUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orgRes, membersRes, usageRes] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch(`/api/customers/${id}/members`),
        fetch(`/api/customers/${id}/usage`),
      ]);
      if (orgRes.ok) {
        const { organization } = await orgRes.json();
        setOrg(organization);
      }
      if (membersRes.ok) {
        const { members: m } = await membersRes.json();
        setMembers(m);
      }
      if (usageRes.ok) {
        const { usage: u } = await usageRes.json();
        setUsage(u);
      }
    } catch (error) {
      console.error("Error loading customer:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshOrg = async () => {
    const res = await fetch(`/api/customers/${id}`);
    if (res.ok) {
      const { organization } = await res.json();
      setOrg(organization);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!org) {
    return (
      <>
        <Header title="Customer Not Found" />
        <div className="p-6 text-center text-muted-foreground">
          <p>The requested organization could not be found.</p>
          <Button asChild className="mt-4">
            <Link href="/customers">Back to Customers</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={org.name} description={`${org.slug} · ${org.type}`} />

      <div className="p-3 sm:p-4 md:p-6 space-y-4">
        {/* Back link */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
          </Link>
        </Button>

        {/* Tabs */}
        <div className="flex gap-1 border-b overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <CustomerOverviewTab org={org} />}
        {activeTab === "subscription" && <CustomerSubscriptionTab org={org} />}
        {activeTab === "usage" && <CustomerUsageTab org={org} usage={usage} />}
        {activeTab === "members" && <CustomerMembersTab members={members} />}
        {activeTab === "actions" && (
          <CustomerActionsTab org={org} onRefresh={refreshOrg} />
        )}
      </div>
    </>
  );
}
