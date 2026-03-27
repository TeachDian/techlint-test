import { useToast } from "@client/contexts/ToastContext";
import { cn } from "@client/lib/cn";
import { Button } from "@client/components/ui/button";
import { Card } from "@client/components/ui/card";

const toneStyles = {
  info: "border-border bg-card text-card-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-rose-200 bg-rose-50 text-rose-900",
};

export function ToastViewport() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 flex w-[min(92vw,22rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <Card key={toast.id} className={cn("pointer-events-auto p-4 shadow-board", toneStyles[toast.tone])}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description ? <p className="mt-1 text-sm leading-5 opacity-90">{toast.description}</p> : null}
            </div>
            <Button className="h-auto px-2 py-1" onClick={() => removeToast(toast.id)} size="sm" variant="ghost">
              Close
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

