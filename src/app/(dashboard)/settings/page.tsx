"use client";

import { Suspense, useCallback, useState } from "react";
import { Header } from "@/components/layout/Header";
import { AppearanceCard } from "./AppearanceCard";
import { GmailSettingsCard } from "./GmailSettingsCard";
import { DataManagementCard } from "./DataManagementCard";
import { AboutCard } from "./AboutCard";
import { GmailCallbackHandler } from "./GmailCallbackHandler";

export default function SettingsPage() {
  const [gmailKey, setGmailKey] = useState(0);

  const handleGmailSuccess = useCallback(() => {
    // Force GmailSettingsCard to refetch status
    setGmailKey((k) => k + 1);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <GmailCallbackHandler onSuccess={handleGmailSuccess} />
      </Suspense>

      <Header
        title="Settings"
        description="Manage your CRM preferences"
      />

      <div className="p-6 space-y-6 max-w-2xl">
        <AppearanceCard />
        <GmailSettingsCard key={gmailKey} />
        <DataManagementCard />
        <AboutCard />
      </div>
    </>
  );
}
