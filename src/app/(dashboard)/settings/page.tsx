"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);

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
                  className={cn(theme === "light" && "border-primary bg-primary/10")}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Light
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className={cn(theme === "dark" && "border-primary bg-primary/10")}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Dark
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTheme("system")}
                  className={cn(theme === "system" && "border-primary bg-primary/10")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  System
                </Button>
              </div>
            </div>
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
