"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface GmailCallbackHandlerProps {
  onSuccess: () => void;
}

export function GmailCallbackHandler({ onSuccess }: GmailCallbackHandlerProps) {
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
