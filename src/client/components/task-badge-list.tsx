import type { BadgeDefinition } from "@shared/api";
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
          <span
            className="inline-flex items-center border px-2 py-0.5 text-xs font-medium uppercase tracking-[0.08em] text-white"
            style={{ backgroundColor: badge.color, borderColor: badge.color }}
          >
            {badge.title}
          </span>
        </Tooltip>
      ))}
    </div>
  );
}
