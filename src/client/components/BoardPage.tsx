import { startTransition, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import { BoardColumn } from "@client/components/BoardColumn";
import { BoardHeader } from "@client/components/BoardHeader";
import { BoardSidebar } from "@client/components/BoardSidebar";
import { CreateCategoryForm } from "@client/components/CreateCategoryForm";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { useAuth } from "@client/contexts/AuthContext";
import { useBoard } from "@client/contexts/BoardContext";
import { useToast } from "@client/contexts/ToastContext";
import {
  buildBoardMaps,
  getBoardMetrics,
  getBoardNotifications,
  readDragPayload,
} from "@client/lib/board";
import type { DragPayload, DropTarget } from "@client/lib/board";
import { getExpiryState } from "@client/lib/date";
import { cn } from "@client/lib/cn";

function LoadingState({ title, description }: { title: string; description: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </main>
  );
}

export function BoardPage() {
  const { logout } = useAuth();
  const { board, loading, selectedTask, selectedTaskId, setSelectedTaskId, createCategory, createTask, moveTask } = useBoard();
  const { addToast } = useToast();
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const notifiedTaskIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!board) {
      return;
    }

    const nextNotifiedTaskIds = new Set<string>();

    for (const task of board.tasks) {
      const expiryState = getExpiryState(task.expiryAt);

      if (!expiryState.isNearExpiry) {
        continue;
      }

      nextNotifiedTaskIds.add(task.id);

      if (!notifiedTaskIdsRef.current.has(task.id)) {
        addToast({
          title: expiryState.isOverdue ? `Overdue: ${task.title}` : `Due soon: ${task.title}`,
          description: expiryState.detail ?? "Check the task deadline.",
          tone: expiryState.isOverdue ? "danger" : "warning",
        });
      }
    }

    notifiedTaskIdsRef.current = nextNotifiedTaskIds;
  }, [board, addToast]);

  if (loading || !board) {
    return <LoadingState description="Preparing your board." title="Loading" />;
  }

  const { tasksByCategory, categoryNameMap, taskNameMap } = buildBoardMaps(board);
  const { totalTaskCount, dueSoonCount, overdueCount } = getBoardMetrics(board);
  const notifications = getBoardNotifications(board, categoryNameMap);
  const selectedTaskHistory = selectedTask ? board.history.filter((item) => item.taskId === selectedTask.id) : [];

  async function handleLogout() {
    try {
      await logout();
    } catch (_error) {
      addToast({
        title: "Sign out failed",
        description: "Please try again.",
        tone: "danger",
      });
    }
  }

  async function handleToggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch (_error) {
      addToast({
        title: "Full screen unavailable",
        description: "Your browser blocked the full screen request.",
        tone: "danger",
      });
    }
  }

  function handleTaskDragStart(event: DragEvent<HTMLElement>, taskId: string, categoryId: string, index: number) {
    const payload = JSON.stringify({ taskId, categoryId, index } satisfies DragPayload);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", payload);
    event.dataTransfer.setData("text/plain", payload);
  }

  async function handleDropTask(event: DragEvent<HTMLDivElement>, categoryId: string, index: number) {
    event.preventDefault();
    const payload = readDragPayload(event);
    setDropTarget(null);

    if (!payload) {
      return;
    }

    const nextIndex = payload.categoryId === categoryId && payload.index < index ? index - 1 : index;

    if (payload.categoryId === categoryId && payload.index === nextIndex) {
      return;
    }

    try {
      await moveTask(payload.taskId, {
        categoryId,
        position: Math.max(0, nextIndex),
      });
    } catch (_error) {
      addToast({
        title: "Move failed",
        description: "The task could not be moved. Please try again.",
        tone: "danger",
      });
    }
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <BoardHeader
        categoryAction={<CreateCategoryForm onCreate={createCategory} />}
        dueSoonCount={dueSoonCount}
        isFocusMode={isFocusMode}
        isFullscreen={isFullscreen}
        onLogout={handleLogout}
        onToggleFocusMode={() => setIsFocusMode((current) => !current)}
        onToggleFullscreen={handleToggleFullscreen}
        overdueCount={overdueCount}
        totalTaskCount={totalTaskCount}
      />

      <div className={cn("grid h-[calc(100vh-56px)] min-h-0", isFocusMode ? "grid-cols-1" : "xl:grid-cols-[minmax(0,1fr)_24rem]")}>
        <section className="min-h-0 min-w-0 border-r bg-muted/10">
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="flex h-full min-w-max gap-4 p-4">
              {board.categories.map((category) => (
                <BoardColumn
                  key={category.id}
                  category={category}
                  dropTarget={dropTarget}
                  onCreateTask={createTask}
                  onDropPreview={setDropTarget}
                  onDropTask={handleDropTask}
                  onTaskDragEnd={() => setDropTarget(null)}
                  onTaskDragStart={handleTaskDragStart}
                  onTaskSelect={(taskId) => {
                    startTransition(() => {
                      setSelectedTaskId(taskId);
                    });
                  }}
                  selectedTaskId={selectedTaskId}
                  tasks={tasksByCategory.get(category.id) ?? []}
                />
              ))}
            </div>
          </div>
        </section>

        {!isFocusMode ? (
          <aside className="min-h-0 border-l bg-background">
            <BoardSidebar
              boardHistory={board.history}
              categoryNameMap={categoryNameMap}
              notifications={notifications}
              onSelectTask={(taskId) => {
                startTransition(() => {
                  setSelectedTaskId(taskId);
                });
              }}
              selectedTask={selectedTask}
              selectedTaskHistory={selectedTaskHistory}
              taskNameMap={taskNameMap}
            />
          </aside>
        ) : null}
      </div>
    </main>
  );
}
