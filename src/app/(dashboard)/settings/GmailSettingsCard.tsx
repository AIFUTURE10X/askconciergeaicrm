"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, XCircle, Loader2, RefreshCw, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

export function GmailSettingsCard() {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
  const [isLoadingGmail, setIsLoadingGmail] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchGmailStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/gmail/status");
      const data = await res.json();
      setGmailStatus(data);
    } catch {
      setGmailStatus({ configured: false, connected: false, accounts: [] });
    } finally {
      setIsLoadingGmail(false);
    }
  }, []);

  useEffect(() => {
    fetchGmailStatus();
  }, [fetchGmailStatus]);

  const handleConnectGmail = () => {
    window.location.href = "/api/gmail/authorize";
  };

  const handleDisconnectGmail = async (accountId: string, email: string) => {
    if (!confirm(`Disconnect ${email}? Email sync will stop for this account.`)) return;

    setDisconnectingId(accountId);
    try {
      const res = await fetch("/api/gmail/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        setGmailStatus((prev) =>
          prev ? {
            ...prev,
            accounts: prev.accounts.filter((a) => a.id !== accountId),
            connected: prev.accounts.length > 1,
          } : prev
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
          toast.success(`Synced ${data.processed} new email(s)`);
        } else {
          toast.info("No new emails to sync");
        }
        fetchGmailStatus();
      } else {
        toast.error(data.error || "Sync failed");
      }
    } catch {
      toast.error("Failed to sync emails");
    } finally {
      setIsSyncing(false);
    }
  };

  // Expose fetchGmailStatus for external refresh (OAuth callback)
  useEffect(() => {
    (window as unknown as { refreshGmailStatus?: () => void }).refreshGmailStatus = fetchGmailStatus;
    return () => {
      delete (window as unknown as { refreshGmailStatus?: () => void }).refreshGmailStatus;
    };
  }, [fetchGmailStatus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Integration
        </CardTitle>
        <CardDescription>Connect multiple Gmail accounts to sync emails as leads</CardDescription>
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
              Add these environment variables to enable Gmail:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li><code>GMAIL_CLIENT_ID</code></li>
              <li><code>GMAIL_CLIENT_SECRET</code></li>
              <li><code>GMAIL_REDIRECT_URI</code></li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            {gmailStatus.accounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connected Accounts</span>
                  <Button variant="outline" size="sm" onClick={handleSyncNow} disabled={isSyncing}>
                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Sync All
                  </Button>
                </div>
                <div className="space-y-2">
                  {gmailStatus.accounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                        <div>
                          <div className="text-sm font-medium">{account.name || account.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {account.email}
                            {account.lastSyncAt && (
                              <span className="ml-2">• Last sync: {formatDistanceToNow(new Date(account.lastSyncAt), { addSuffix: true })}</span>
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
                        {disconnectingId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
  );
}
