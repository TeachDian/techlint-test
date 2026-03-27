import type { DragEvent } from "react";
import type { Task } from "@shared/api";
import { cn } from "@client/lib/cn";
import { formatDateTime } from "@client/lib/date";
import { StatusBadge } from "@client/components/StatusBadge";
import { Tooltip } from "@client/components/ui/tooltip";

type TaskCardProps = {
  task: Task;
  index: number;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, taskId: string, categoryId: string, index: number) => void;
  onDragEnd: () => void;
};

function trimDescription(description: string) {
  if (description.length <= 140) {
    return description;
  }

  return `${description.slice(0, 137)}...`;
}

export function TaskCard({ task, index, isSelected, onSelect, onDragStart, onDragEnd }: TaskCardProps) {
  return (
    <article
      className={cn(
        "cursor-pointer border bg-card p-3 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30",
        isSelected && "border-primary bg-accent/20",
      )}
      draggable
      onClick={() => onSelect(task.id)}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart(event, task.id, task.categoryId, index)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{task.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">Card {index + 1}</p>
        </div>
        <Tooltip content={task.expiryAt ? `Deadline: ${formatDateTime(task.expiryAt)}` : "No deadline set"}>
          <div>
            <StatusBadge expiryAt={task.expiryAt} />
          </div>
        </Tooltip>
      </div>

      {task.description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{trimDescription(task.description)}</p>
      ) : (
        <p className="mt-3 text-sm italic leading-6 text-muted-foreground">No description yet.</p>
      )}

      <div className="mt-4 text-xs text-muted-foreground">
        {task.draftSavedAt ? `Draft saved ${formatDateTime(task.draftSavedAt)}` : "No draft save yet"}
      </div>
    </article>
  );
}
