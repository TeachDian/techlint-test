import type { DragEvent } from "react";
import type { BadgeDefinition, Category, Priority, Task } from "@shared/api";
import { cn } from "@client/lib/cn";
import { createDropTarget, type DropTarget } from "@client/hooks/use-board-drag";
import { CreateTaskForm } from "@client/components/create-task-form";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { TaskCard } from "@client/components/task-card";

type BoardColumnProps = {
  category: Category;
  tasks: Task[];
  selectedTaskId: string | null;
  draggingTaskId: string | null;
  dropTarget: DropTarget;
  commentCountMap: Record<string, number>;
  badgesByTask: Map<string, BadgeDefinition[]>;
  onCreateTask: (payload: { categoryId: string; title: string; description?: string; expiryAt?: string | null; priority?: Priority | null }) => Promise<void>;
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
  onCreateTask,
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
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm uppercase tracking-[0.14em]">{category.name}</CardTitle>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
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

        <CreateTaskForm categoryId={category.id} onCreate={onCreateTask} />
      </CardContent>
    </Card>
  );
}
