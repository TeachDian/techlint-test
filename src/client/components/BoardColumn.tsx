import type { DragEvent } from "react";
import type { Category, Task } from "@shared/api";
import { cn } from "@client/lib/cn";
import type { DropTarget } from "@client/lib/board";
import { CreateTaskForm } from "@client/components/CreateTaskForm";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { TaskCard } from "@client/components/TaskCard";

type BoardColumnProps = {
  category: Category;
  tasks: Task[];
  selectedTaskId: string | null;
  dropTarget: DropTarget;
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
  dropTarget,
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
        className={cn(
          "border-2 border-dashed transition-all",
          active && "h-12 border-primary bg-primary/5",
          !active && tasks.length === 0 && "h-16 border-border bg-muted/50",
          !active && tasks.length > 0 && "h-2 border-transparent bg-transparent",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          onDropPreview({ categoryId: category.id, index });
        }}
        onDrop={(event) => onDropTask(event, category.id, index)}
      />
    );
  }

  return (
    <Card className="flex h-full min-h-0 w-[21rem] flex-col bg-muted/20 shadow-none">
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
                index={index}
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
