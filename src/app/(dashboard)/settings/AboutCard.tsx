import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AboutCard() {
  return (
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
  );
}
