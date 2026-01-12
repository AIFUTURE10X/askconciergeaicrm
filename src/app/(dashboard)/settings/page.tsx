"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Download, Trash2, Mail, CheckCircle2, XCircle, Loader2, RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface GmailAccount {
  id: string;
  email: string;
  name: string | null;
  lastSyncAt: string | null;
  createdAt: string;
}

interface GmailStatus {
  configured: boolean;
  connected: boolean;
  accounts: GmailAccount[];
}

// Component to handle Gmail OAuth callback params
function GmailCallbackHandler({
  onSuccess
}: {
  onSuccess: () => void
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const gmailResult = searchParams.get("gmail");
    const email = searchParams.get("email");
    const message = searchParams.get("message");

    if (gmailResult === "success") {
      toast.success(email ? `Gmail account ${email} connected!` : "Gmail connected successfully!");
      window.history.replaceState({}, "", "/settings");
      onSuccess();
    } else if (gmailResult === "error") {
      toast.error(message ? `Gmail connection failed: ${message}` : "Gmail connection failed");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, onSuccess]);

  return null;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Gmail integration state
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Gmail status on mount
  const fetchGmailStatus = async () => {
    try {
      const res = await fetch("/api/gmail/status");
      const data = await res.json();
      setGmailStatus(data);
    } catch {
      setGmailStatus({ configured: false, connected: false, accounts: [] });
    } finally {
      setIsLoadingGmail(false);
    }
  };

  useEffect(() => {
    fetchGmailStatus();
  }, []);

  const handleConnectGmail = () => {
    window.location.href = "/api/gmail/authorize";
  };

  const handleDisconnectGmail = async (accountId: string, email: string) => {
    if (!confirm(`Are you sure you want to disconnect ${email}? Email sync will stop for this account.`)) {
      return;
    }
    setDisconnectingId(accountId);
    try {
      const res = await fetch("/api/gmail/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        setGmailStatus((prev) =>
          prev
            ? {
                ...prev,
                accounts: prev.accounts.filter((a) => a.id !== accountId),
                connected: prev.accounts.length > 1,
              }
            : prev
        );
        toast.success(`${email} disconnected successfully`);
      } else {
        toast.error("Failed to disconnect Gmail");
      }
    } catch {
      toast.error("Failed to disconnect Gmail");
    } finally {
      setDisconnectingId(null);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/gmail/sync", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        if (data.processed > 0) {
          toast.success(`Synced ${data.processed} new email(s) from ${data.accounts?.length || 1} account(s)`);
        } else {
          toast.info("No new emails to sync");
        }
        // Refresh status to update last sync times
        fetchGmailStatus();
      } else if (data.message === "Gmail not connected") {
        toast.error("Gmail is not connected");
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Failed to sync emails");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      // Fetch all data
      const [contactsRes, dealsRes, activitiesRes, remindersRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/deals"),
        fetch("/api/activities"),
        fetch("/api/reminders"),
      ]);

      const [contactsData, dealsData, activitiesData, remindersData] = await Promise.all([
        contactsRes.json(),
        dealsRes.json(),
        activitiesRes.json(),
        remindersRes.json(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        contacts: contactsData.contacts || [],
        deals: dealsData.deals || [],
        activities: activitiesData.activities || [],
        reminders: remindersData.reminders || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `askconciergeai-crm-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearLocalStorage = () => {
    if (confirm("This will reset sidebar state and theme preference. Continue?")) {
      localStorage.clear();
      toast.success("Local storage cleared. Refresh the page.");
    }
  };

  return (
    <>
      {/* Handle Gmail OAuth callback params */}
      <Suspense fallback={null}>
        <GmailCallbackHandler onSuccess={fetchGmailStatus} />
      </Suspense>

      <Header
        title="Settings"
        description="Manage your CRM preferences"
      />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how the CRM looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme("light")}
                  className={cn(mounted && theme === "light" && "border-primary bg-primary/10")}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className={cn(mounted && theme === "dark" && "border-primary bg-primary/10")}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme("system")}
                  className={cn(mounted && theme === "system" && "border-primary bg-primary/10")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gmail Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gmail Integration
            </CardTitle>
            <CardDescription>
              Connect multiple Gmail accounts to sync emails as leads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingGmail ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking Gmail status...
              </div>
            ) : !gmailStatus?.configured ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Gmail not configured</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  To enable Gmail integration, add the following environment variables:
                </p>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li><code>GMAIL_CLIENT_ID</code> - Google OAuth client ID</li>
                  <li><code>GMAIL_CLIENT_SECRET</code> - Google OAuth client secret</li>
                  <li><code>GMAIL_REDIRECT_URI</code> - OAuth redirect URL</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Connected Accounts */}
                {gmailStatus.accounts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Connected Accounts</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncNow}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-2" />
                        )}
                        Sync All
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {gmailStatus.accounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                            <div>
                              <div className="text-sm font-medium">
                                {account.name || account.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {account.email}
                                {account.lastSyncAt && (
                                  <span className="ml-2">
                                    • Last sync: {formatDistanceToNow(new Date(account.lastSyncAt), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnectGmail(account.id, account.email)}
                            disabled={disconnectingId === account.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {disconnectingId === account.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Account Button */}
                <div className="pt-2">
                  <Button onClick={handleConnectGmail} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    {gmailStatus.accounts.length > 0 ? "Add Another Account" : "Connect Gmail Account"}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    {gmailStatus.accounts.length > 0
                      ? "Connect additional Gmail accounts to sync emails from multiple businesses."
                      : "Connect your Gmail to automatically import business inquiries as leads."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export or manage your CRM data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Export All Data</Label>
                <p className="text-sm text-muted-foreground">
                  Download all contacts, deals, activities, and reminders as JSON
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleExportAll}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label>Clear Local Storage</Label>
                <p className="text-sm text-muted-foreground">
                  Reset sidebar state and theme preference
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleClearLocalStorage}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>AskConciergeAI CRM</strong></p>
              <p>Sales pipeline management for AskConciergeAI</p>
              <p className="pt-2">
                Built with Next.js, Drizzle ORM, and shadcn/ui
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
