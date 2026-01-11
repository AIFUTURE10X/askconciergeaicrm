"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Download, Trash2, Mail, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Component to handle Gmail OAuth callback params
function GmailCallbackHandler({
  setGmailStatus
}: {
  setGmailStatus: (status: { configured: boolean; connected: boolean }) => void
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const gmailResult = searchParams.get("gmail");
    const message = searchParams.get("message");

    if (gmailResult === "success") {
      toast.success("Gmail connected successfully!");
      window.history.replaceState({}, "", "/settings");
      setGmailStatus({ configured: true, connected: true });
    } else if (gmailResult === "error") {
      toast.error(message ? `Gmail connection failed: ${message}` : "Gmail connection failed");
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, setGmailStatus]);

  return null;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Gmail integration state
  const [gmailStatus, setGmailStatus] = useState<{
    configured: boolean;
    connected: boolean;
  } | null>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Gmail status on mount
  useEffect(() => {
    async function fetchGmailStatus() {
      try {
        const res = await fetch("/api/gmail/status");
        const data = await res.json();
        setGmailStatus(data);
      } catch {
        setGmailStatus({ configured: false, connected: false });
      } finally {
        setIsLoadingGmail(false);
      }
    }
    fetchGmailStatus();
  }, []);

  const handleConnectGmail = () => {
    window.location.href = "/api/gmail/authorize";
  };

  const handleDisconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect Gmail? Email sync will stop.")) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const res = await fetch("/api/gmail/disconnect", { method: "POST" });
      if (res.ok) {
        setGmailStatus({ configured: gmailStatus?.configured ?? false, connected: false });
        toast.success("Gmail disconnected successfully");
      } else {
        toast.error("Failed to disconnect Gmail");
      }
    } catch {
      toast.error("Failed to disconnect Gmail");
    } finally {
      setIsDisconnecting(false);
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
        <GmailCallbackHandler setGmailStatus={setGmailStatus} />
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
              Automatically sync incoming emails as leads
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
            ) : gmailStatus.connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Gmail connected</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectGmail}
                    disabled={isDisconnecting}
                    className="text-destructive hover:text-destructive"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Disconnect
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Emails are synced every 5 minutes. New emails create leads automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">Gmail not connected</span>
                </div>
                <Button onClick={handleConnectGmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Connect Gmail
                </Button>
                <p className="text-sm text-muted-foreground">
                  Connect your Gmail to automatically import business inquiries as leads.
                </p>
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
