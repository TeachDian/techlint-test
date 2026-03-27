import type { DragEvent, KeyboardEvent } from "react";
import type { BadgeDefinition, Task } from "@shared/api";
import { cn } from "@client/lib/cn";
import { formatDateTime } from "@client/lib/date";
import { getPriorityBadgeClass, getPriorityCardClass, getPriorityLabel } from "@client/lib/task-priority";
import { createDropTarget, resolveCardDropMode, type DropTarget } from "@client/hooks/use-board-drag";
import { StatusBadge } from "@client/components/status-badge";
import { TaskBadgeList } from "@client/components/task-badge-list";
import { Tooltip } from "@client/components/ui/tooltip";

type TaskCardProps = {
  task: Task;
  index: number;
  badges: BadgeDefinition[];
  commentCount: number;
  dropTarget: DropTarget;
  isDragging: boolean;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  onKeyboardMove: (taskId: string, direction: "up" | "down" | "left" | "right") => void;
  onDragStart: (event: DragEvent<HTMLElement>, taskId: string, categoryId: string, index: number) => void;
  onDragEnd: () => void;
  onDropPreview: (target: Exclude<DropTarget, null>) => void;
  onDropTask: (event: DragEvent<HTMLElement>, target: Exclude<DropTarget, null>) => void;
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

function getDropTargetForCard(event: DragEvent<HTMLElement>, task: Task, index: number) {
  const rect = event.currentTarget.getBoundingClientRect();
  const pointerOffsetY = event.clientY - rect.top;
  const mode = resolveCardDropMode(pointerOffsetY, rect.height);
  return createDropTarget(task.categoryId, index, mode, task.id);
}

function getKeyboardDirection(event: KeyboardEvent<HTMLElement>) {
  if (!(event.altKey && event.shiftKey)) {
    return null;
  }

  if (event.key === "ArrowUp") {
    return "up";
  }

  if (event.key === "ArrowDown") {
    return "down";
  }

  if (event.key === "ArrowLeft") {
    return "left";
  }

  if (event.key === "ArrowRight") {
    return "right";
  }

  return null;
}

export function TaskCard({
  task,
  index,
  badges,
  commentCount,
  dropTarget,
  isDragging,
  isSelected,
  onSelect,
  onKeyboardMove,
  onDragStart,
  onDragEnd,
  onDropPreview,
  onDropTask,
}: TaskCardProps) {
  const isDropTarget = dropTarget?.taskId === task.id;

  return (
    <article
      aria-grabbed={isDragging}
      aria-keyshortcuts="Alt+Shift+ArrowUp Alt+Shift+ArrowDown Alt+Shift+ArrowLeft Alt+Shift+ArrowRight"
      className={cn(
        "task-card-shell",
        getPriorityCardClass(task.priority),
        isSelected && "task-card-shell-active",
        isDragging && "task-card-shell-dragging",
        isDropTarget && dropTarget.mode === "before" && "task-card-drop-before",
        isDropTarget && dropTarget.mode === "after" && "task-card-drop-after",
        isDropTarget && dropTarget.mode === "swap" && "task-card-drop-swap",
      )}
      data-testid={`task-card-${task.id}`}
      draggable
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task.id)}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        onDropPreview(getDropTargetForCard(event, task, index));
      }}
      onDragStart={(event) => onDragStart(event, task.id, task.categoryId, index)}
      onDrop={(event) => onDropTask(event, getDropTargetForCard(event, task, index))}
      onKeyDown={(event) => {
        const direction = getKeyboardDirection(event);

        if (direction) {
          event.preventDefault();
          onKeyboardMove(task.id, direction);
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(task.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="task-meta-row">
            <span className="font-mono text-xs">::</span>
            <span>Drag card or use Alt+Shift+Arrow keys</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{task.title}</p>
        </div>
        <Tooltip content={task.expiryAt ? `Deadline: ${formatDateTime(task.expiryAt)}` : "No deadline set"}>
          <div>
            <StatusBadge expiryAt={task.expiryAt} />
          </div>
        </Tooltip>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center border px-2 py-0.5 text-xs font-medium uppercase tracking-[0.08em]", getPriorityBadgeClass(task.priority))}>
          {getPriorityLabel(task.priority)}
        </span>
        <TaskBadgeList badges={badges} />
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

