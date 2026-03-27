import type { DragEvent } from "react";
import type { BadgeDefinition, Category, Priority, Task } from "@shared/api";
import type { CardDensity } from "@client/hooks/use-board-ui-preferences";
import { cn } from "@client/lib/cn";
import { createDropTarget, readDragPayload, resolveCardDropMode, type DropTarget } from "@client/hooks/use-board-drag";
import { CreateTaskForm } from "@client/components/create-task-form";
import { Button } from "@client/components/ui/button";
import { Card, CardContent, CardHeader } from "@client/components/ui/card";
import { Tooltip } from "@client/components/ui/tooltip";
import { TaskCard } from "@client/components/task-card";

type BoardColumnProps = {
  category: Category;
  categoryIndex: number;
  tasks: Task[];
  selectedTaskId: string | null;
  draggingTaskId: string | null;
  dropTarget: DropTarget;
  commentCountMap: Record<string, number>;
  badgesByTask: Map<string, BadgeDefinition[]>;
  canDelete: boolean;
  cardDensity: CardDensity;
  isCategoryDragging: boolean;
  onCreateTask: (payload: { categoryId: string; title: string; description?: string; expiryAt?: string | null; priority?: Priority | null }) => Promise<void>;
  onRequestDeleteCategory: (categoryId: string) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskKeyboardMove: (taskId: string, direction: "up" | "down" | "left" | "right") => void;
  onTaskDragStart: (event: DragEvent<HTMLElement>, taskId: string, categoryId: string, index: number, taskTitle: string) => void;
  onTaskDragEnd: () => void;
  onDropPreview: (target: Exclude<DropTarget, null>) => void;
  onDropTask: (event: DragEvent<HTMLElement>, target: Exclude<DropTarget, null>) => void;
  onCategoryDragStart: (event: DragEvent<HTMLElement>, categoryId: string, index: number, categoryName: string) => void;
  onCategoryDragEnd: () => void;
};

function hasTaskDrag(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer.types).includes("application/x-board-task");
}

function getStackDropTarget(container: HTMLDivElement, categoryId: string, clientY: number) {
  const taskElements = Array.from(container.querySelectorAll<HTMLElement>("[data-board-task-card='true']"));

  if (taskElements.length === 0) {
    return createDropTarget(categoryId, 0, "before");
  }

  const closestTaskElement = taskElements.reduce((closest, element) => {
    const rect = element.getBoundingClientRect();
    const distance = Math.abs(clientY - (rect.top + rect.height / 2));

    if (!closest || distance < closest.distance) {
      return { element, distance };
    }

    return closest;
  }, null as { element: HTMLElement; distance: number } | null)?.element;

  if (!closestTaskElement) {
    return createDropTarget(categoryId, 0, "before");
  }

  const taskId = closestTaskElement.dataset.taskId ?? null;
  const index = Number(closestTaskElement.dataset.taskIndex ?? 0);
  const rect = closestTaskElement.getBoundingClientRect();
  const mode = resolveCardDropMode(clientY - rect.top, rect.height);

  return createDropTarget(categoryId, index, mode, taskId);
}

export function BoardColumn({
  category,
  categoryIndex,
  tasks,
  selectedTaskId,
  draggingTaskId,
  dropTarget,
  commentCountMap,
  badgesByTask,
  canDelete,
  cardDensity,
  isCategoryDragging,
  onCreateTask,
  onRequestDeleteCategory,
  onTaskSelect,
  onTaskKeyboardMove,
  onTaskDragStart,
  onTaskDragEnd,
  onDropPreview,
  onDropTask,
  onCategoryDragStart,
  onCategoryDragEnd,
}: BoardColumnProps) {
  function renderDropZone(index: number) {
    const target = createDropTarget(category.id, index, "before");
    const active = dropTarget?.categoryId === category.id && dropTarget.index === index && dropTarget.mode === "before" && !dropTarget.taskId;

    return (
      <div
        key={`${category.id}-drop-${index}`}
        className={cn(
          "board-drop-zone",
          index === 0 && "board-drop-zone-leading",
          active && "board-drop-zone-active",
          !active && tasks.length === 0 && "board-drop-zone-empty",
        )}
        data-testid={`drop-zone-${category.id}-${index}`}
        onDragOver={(event) => {
          if (!readDragPayload(event)) {
            return;
          }

          event.preventDefault();
          onDropPreview(target);
        }}
        onDrop={(event) => {
          if (!readDragPayload(event)) {
            return;
          }

          void onDropTask(event, target);
        }}
      >
        {active ? <span className="text-[11px] uppercase tracking-[0.14em] text-primary">Drop here</span> : null}
      </div>
    );
  }

  return (
    <Card className={cn("board-column-shell", isCategoryDragging && "board-column-shell-dragging")} data-testid={`board-column-${category.id}`}>
      <CardHeader className="board-column-header">
        <div className="board-column-title-row">
          <div className="min-w-0">
            <p className="section-kicker">Stage</p>
            <p className="board-column-title">{category.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip content="Drag to reorder this stage.">
              <button
                aria-label={`Reorder stage ${category.name}`}
                className="stage-drag-handle"
                data-testid={`stage-handle-${category.id}`}
                draggable
                onDragEnd={onCategoryDragEnd}
                onDragStart={(event) => onCategoryDragStart(event, category.id, categoryIndex, category.name)}
                type="button"
              >
                ::
              </button>
            </Tooltip>
            <span className="board-column-count">{tasks.length}</span>
            {canDelete ? (
              <Tooltip content="Delete this empty stage.">
                <Button onClick={() => onRequestDeleteCategory(category.id)} size="sm" variant="ghost">
                  Delete
                </Button>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="board-column-body">
        <div
          className="board-column-stack"
          onDragOverCapture={(event) => {
            if (!hasTaskDrag(event)) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            onDropPreview(getStackDropTarget(event.currentTarget, category.id, event.clientY));
          }}
          onDropCapture={(event) => {
            if (!readDragPayload(event)) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            void onDropTask(event, getStackDropTarget(event.currentTarget, category.id, event.clientY));
          }}
        >
          {renderDropZone(0)}

          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              badges={badgesByTask.get(task.id) ?? []}
              cardDensity={cardDensity}
              commentCount={commentCountMap[task.id] ?? 0}
              dropTarget={dropTarget}
              index={index}
              isDragging={draggingTaskId === task.id}
              isSelected={task.id === selectedTaskId}
              onDragEnd={onTaskDragEnd}
              onDragStart={onTaskDragStart}
              onDropPreview={onDropPreview}
              onDropTask={onDropTask}
              onKeyboardMove={onTaskKeyboardMove}
              onSelect={onTaskSelect}
              task={task}
            />
          ))}

          {renderDropZone(tasks.length)}
        </div>

        <div className="board-column-footer">
          <CreateTaskForm categoryId={category.id} onCreate={onCreateTask} />
        </div>
      </CardContent>
    </Card>
  );
}

