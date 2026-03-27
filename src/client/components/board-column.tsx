import type { DragEvent } from "react";
import type { BadgeDefinition, Category, Priority, Task } from "@shared/api";
import { cn } from "@client/lib/cn";
import { createDropTarget, type DropTarget } from "@client/hooks/use-board-drag";
import { CreateTaskForm } from "@client/components/create-task-form";
import { Button } from "@client/components/ui/button";
import { Card, CardContent, CardHeader } from "@client/components/ui/card";
import { Tooltip } from "@client/components/ui/tooltip";
import { TaskCard } from "@client/components/task-card";

type BoardColumnProps = {
  category: Category;
  tasks: Task[];
  selectedTaskId: string | null;
  draggingTaskId: string | null;
  dropTarget: DropTarget;
  commentCountMap: Record<string, number>;
  badgesByTask: Map<string, BadgeDefinition[]>;
  canDelete: boolean;
  onCreateTask: (payload: { categoryId: string; title: string; description?: string; expiryAt?: string | null; priority?: Priority | null }) => Promise<void>;
  onRequestDeleteCategory: (categoryId: string) => void;
  onTaskSelect: (taskId: string) => void;
  onTaskKeyboardMove: (taskId: string, direction: "up" | "down" | "left" | "right") => void;
  onTaskDragStart: (event: DragEvent<HTMLElement>, taskId: string, categoryId: string, index: number) => void;
  onTaskDragEnd: () => void;
  onDropPreview: (target: Exclude<DropTarget, null>) => void;
  onDropTask: (event: DragEvent<HTMLElement>, target: Exclude<DropTarget, null>) => void;
};

export function BoardColumn({
  category,
  tasks,
  selectedTaskId,
  draggingTaskId,
  dropTarget,
  commentCountMap,
  badgesByTask,
  canDelete,
  onCreateTask,
  onRequestDeleteCategory,
  onTaskSelect,
  onTaskKeyboardMove,
  onTaskDragStart,
  onTaskDragEnd,
  onDropPreview,
  onDropTask,
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
          event.preventDefault();
          onDropPreview(target);
        }}
        onDrop={(event) => onDropTask(event, target)}
      >
        {active ? <span className="text-[11px] uppercase tracking-[0.14em] text-primary">Drop here</span> : null}
      </div>
    );
  }

  return (
    <Card className="board-column-shell" data-testid={`board-column-${category.id}`}>
      <CardHeader className="board-column-header">
        <div className="board-column-title-row">
          <div className="min-w-0">
            <p className="section-kicker">Stage</p>
            <p className="board-column-title">{category.name}</p>
          </div>
          <div className="flex items-center gap-2">
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
        <div className="board-column-stack">
          {renderDropZone(0)}

          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              badges={badgesByTask.get(task.id) ?? []}
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
