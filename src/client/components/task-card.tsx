import type { DragEvent } from "react";
import type { Task } from "@shared/api";
import { cn } from "@client/lib/cn";
import { formatDateTime } from "@client/lib/date";
import { StatusBadge } from "@client/components/status-badge";
import { Tooltip } from "@client/components/ui/tooltip";

type TaskCardProps = {
  task: Task;
  index: number;
  commentCount: number;
  isDragging: boolean;
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

function getCommentLabel(commentCount: number) {
  return `${commentCount} comment${commentCount === 1 ? "" : "s"}`;
}

export function TaskCard({ task, index, commentCount, isDragging, isSelected, onSelect, onDragStart, onDragEnd }: TaskCardProps) {
  return (
    <article
      aria-grabbed={isDragging}
      className={cn(
        "task-card-shell",
        isSelected && "task-card-shell-active",
        isDragging && "task-card-shell-dragging",
      )}
      draggable
      onClick={() => onSelect(task.id)}
      onDragEnd={onDragEnd}
      onDragStart={(event) => onDragStart(event, task.id, task.categoryId, index)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="task-meta-row">
            <span className="font-mono text-xs">::</span>
            <span>Drag card</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{task.title}</p>
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

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{getCommentLabel(commentCount)}</span>
        <span>{task.draftSavedAt ? `Draft saved ${formatDateTime(task.draftSavedAt)}` : "No draft save yet"}</span>
      </div>
    </article>
  );
}
