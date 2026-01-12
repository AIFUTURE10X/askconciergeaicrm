"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppearanceCard() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
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
  );
}
