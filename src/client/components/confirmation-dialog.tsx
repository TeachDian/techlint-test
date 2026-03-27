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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/20 px-4" data-testid="confirmation-dialog">
      <Card className="w-full max-w-md panel-surface">
        <CardHeader className="border-b">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
          <div className="flex justify-end gap-2">
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

