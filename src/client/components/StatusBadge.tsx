import { Badge } from "@client/components/ui/badge";
import { getExpiryState } from "@client/lib/date";

type StatusBadgeProps = {
  expiryAt: string | null;
};

const toneVariants = {
  normal: "outline",
  warning: "warning",
  overdue: "destructive",
} as const;

export function StatusBadge({ expiryAt }: StatusBadgeProps) {
  const status = getExpiryState(expiryAt);

  return (
    <Badge className="gap-1" variant={toneVariants[status.tone]}>
      <span>{status.label}</span>
    </Badge>
  );
}
