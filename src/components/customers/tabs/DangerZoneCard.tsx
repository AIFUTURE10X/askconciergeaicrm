import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ChurnReasonDialog } from "@/components/customers/renewals/ChurnReasonDialog";

interface DangerZoneCardProps {
  orgId: string;
  orgName: string;
  subscriptionStatus: string | null;
  isCanceling: boolean;
  showChurnDialog: boolean;
  onCancel: () => void;
  onChurnDialogChange: (open: boolean) => void;
}

export function DangerZoneCard({
  orgId,
  orgName,
  subscriptionStatus,
  isCanceling,
  showChurnDialog,
  onCancel,
  onChurnDialogChange,
}: DangerZoneCardProps) {
  return (
    <>
      {subscriptionStatus !== "canceled" && subscriptionStatus !== "expired" && (
        <Card className="p-4 space-y-3 border-destructive/50">
          <h3 className="font-medium text-destructive">Danger Zone</h3>
          <p className="text-xs text-muted-foreground">
            Database only. Use Stripe dashboard for actual billing changes.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={onCancel}
            disabled={isCanceling}
          >
            {isCanceling && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Mark as Canceled
          </Button>
        </Card>
      )}

      {subscriptionStatus === "canceled" && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium">Log Churn Reason</h3>
          <p className="text-xs text-muted-foreground">Record why this customer canceled for analytics.</p>
          <Button size="sm" variant="outline" onClick={() => onChurnDialogChange(true)}>
            Log Reason
          </Button>
        </Card>
      )}

      {showChurnDialog && (
        <ChurnReasonDialog
          orgId={orgId}
          orgName={orgName}
          onClose={() => onChurnDialogChange(false)}
        />
      )}
    </>
  );
}
