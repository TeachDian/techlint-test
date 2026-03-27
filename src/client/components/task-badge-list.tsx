import type { BadgeDefinition } from "@shared/api";
import { getColorStyleClass } from "@client/lib/color-style";
import { cn } from "@client/lib/cn";
import { Tooltip } from "@client/components/ui/tooltip";

type TaskBadgeListProps = {
  badges: BadgeDefinition[];
};

export function TaskBadgeList({ badges }: TaskBadgeListProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Tooltip key={badge.id} content={badge.description || badge.title}>
          <span className={cn("task-badge-chip", getColorStyleClass(badge.color, "solid"))}>{badge.title}</span>
        </Tooltip>
      ))}
    </div>
  );
}
