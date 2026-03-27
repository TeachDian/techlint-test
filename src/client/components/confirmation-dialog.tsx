import { Button } from "@client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  onClose,
  onConfirm,
}: ConfirmationDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-foreground/18 px-4 py-4 backdrop-blur-sm sm:items-center" data-testid="confirmation-dialog">
      <Card aria-label={title} aria-modal="true" className="dialog-card panel-surface" role="dialog">
        <CardHeader className="space-y-2 border-b pb-4">
          <p className="section-kicker">Confirm</p>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="dialog-content">
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="dialog-actions">
            <Button onClick={onClose} variant="ghost">
              Cancel
            </Button>
            <Button data-testid="confirmation-confirm" onClick={() => void onConfirm()} variant={tone === "danger" ? "destructive" : "default"}>
              {confirmLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

