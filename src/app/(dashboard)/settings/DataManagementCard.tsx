"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DataManagementCard() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
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
    } catch {
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
  );
}
