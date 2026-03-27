import { startTransition, useEffect, useRef, useState } from "react";
import { BoardColumn } from "@client/components/board-column";
import { BoardHeader } from "@client/components/board-header";
import { BoardSidebar } from "@client/components/board-sidebar";
import { CreateCategoryForm } from "@client/components/create-category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { useAuth } from "@client/contexts/AuthContext";
import { useBoard } from "@client/contexts/BoardContext";
import { useToast } from "@client/contexts/ToastContext";
import { useBoardDrag } from "@client/hooks/use-board-drag";
import { buildBoardMaps, getBoardMetrics, getBoardNotifications } from "@client/lib/board";
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
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const notifiedTaskIdsRef = useRef<Set<string>>(new Set());
  const { dropTarget, draggingTaskId, isDragging, handleDropPreview, handleDropTask, handleTaskDragEnd, handleTaskDragStart } = useBoardDrag({
    onMoveTask: moveTask,
    onMoveError: () => {
      addToast({
        title: "Move failed",
        description: "The task could not be moved. Please try again.",
        tone: "danger",
      });
    },
  });

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

  const { tasksByCategory, commentsByTask, categoryNameMap, taskNameMap, commentCountMap } = buildBoardMaps(board);
  const { totalTaskCount, dueSoonCount, overdueCount } = getBoardMetrics(board);
  const notifications = getBoardNotifications(board, categoryNameMap);
  const selectedTaskHistory = selectedTask ? board.history.filter((item) => item.taskId === selectedTask.id) : [];
  const selectedTaskComments = selectedTask ? commentsByTask.get(selectedTask.id) ?? [] : [];

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

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <BoardHeader
        categoryAction={<CreateCategoryForm onCreate={createCategory} />}
        dueSoonCount={dueSoonCount}
        isDragging={isDragging}
        isFocusMode={isFocusMode}
        isFullscreen={isFullscreen}
        onLogout={handleLogout}
        onToggleFocusMode={() => setIsFocusMode((current) => !current)}
        onToggleFullscreen={handleToggleFullscreen}
        overdueCount={overdueCount}
        totalTaskCount={totalTaskCount}
      />

      <div className={cn("min-h-0 flex-1", isFocusMode ? "flex flex-col" : "flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_24rem]") }>
        <section className={cn("min-h-0 min-w-0 bg-muted/10", !isFocusMode && "border-b xl:border-b-0 xl:border-r")}>
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <div className="board-stage">
              {board.categories.map((category) => (
                <BoardColumn
                  key={category.id}
                  category={category}
                  commentCountMap={commentCountMap}
                  draggingTaskId={draggingTaskId}
                  dropTarget={dropTarget}
                  onCreateTask={createTask}
                  onDropPreview={handleDropPreview}
                  onDropTask={handleDropTask}
                  onTaskDragEnd={handleTaskDragEnd}
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
          <aside className="h-[24rem] min-h-0 border-t bg-background xl:h-auto xl:border-l xl:border-t-0">
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
              selectedTaskComments={selectedTaskComments}
              selectedTaskHistory={selectedTaskHistory}
              taskNameMap={taskNameMap}
            />
          </aside>
        ) : null}
      </div>
    </main>
  );
}
