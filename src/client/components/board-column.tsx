import type { DragEvent } from "react";
import type { Category, Task } from "@shared/api";
import { cn } from "@client/lib/cn";
import type { DropTarget } from "@client/hooks/use-board-drag";
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
  onCreateTask: (payload: { categoryId: string; title: string; description?: string; expiryAt?: string | null }) => Promise<void>;
  onTaskSelect: (taskId: string) => void;
  onTaskDragStart: (event: DragEvent<HTMLElement>, taskId: string, categoryId: string, index: number) => void;
  onTaskDragEnd: () => void;
  onDropPreview: (target: DropTarget) => void;
  onDropTask: (event: DragEvent<HTMLDivElement>, categoryId: string, index: number) => void;
};

export function BoardColumn({
  category,
  tasks,
  selectedTaskId,
  draggingTaskId,
  dropTarget,
  commentCountMap,
  onCreateTask,
  onTaskSelect,
  onTaskDragStart,
  onTaskDragEnd,
  onDropPreview,
  onDropTask,
}: BoardColumnProps) {
  function renderDropZone(index: number) {
    const active = dropTarget?.categoryId === category.id && dropTarget.index === index;

    return (
      <div
        key={`${category.id}-drop-${index}`}
        className={cn("board-drop-zone", active && "board-drop-zone-active", !active && tasks.length === 0 && "board-drop-zone-empty")}
        onDragOver={(event) => {
          event.preventDefault();
          onDropPreview({ categoryId: category.id, index });
        }}
        onDrop={(event) => onDropTask(event, category.id, index)}
      >
        {active ? <span className="text-[11px] uppercase tracking-[0.14em] text-primary">Drop here</span> : null}
      </div>
    );
  }

  return (
    <Card className="board-column-shell">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm uppercase tracking-[0.14em]">{category.name}</CardTitle>
          <span className="text-xs text-muted-foreground">{tasks.length}</span>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col pt-4">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {tasks.length === 0 ? renderDropZone(0) : null}

          {tasks.map((task, index) => (
            <div key={task.id} className="space-y-3">
              {renderDropZone(index)}
              <TaskCard
                commentCount={commentCountMap[task.id] ?? 0}
                index={index}
                isDragging={draggingTaskId === task.id}
                isSelected={task.id === selectedTaskId}
                onDragEnd={onTaskDragEnd}
                onDragStart={onTaskDragStart}
                onSelect={onTaskSelect}
                task={task}
              />
            </div>
          ))}

          {renderDropZone(tasks.length)}
        </div>

        <CreateTaskForm categoryId={category.id} onCreate={onCreateTask} />
      </CardContent>
    </Card>
  );
}
