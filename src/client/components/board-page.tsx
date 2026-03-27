import { startTransition, useEffect, useRef, useState } from "react";
import { BoardColumn } from "@client/components/board-column";
import { BoardFilters } from "@client/components/board-filters";
import { BoardHeader } from "@client/components/board-header";
import { BoardSidebar } from "@client/components/board-sidebar";
import { BoardWorkspace } from "@client/components/board-workspace";
import { ConfirmationDialog } from "@client/components/confirmation-dialog";
import { CreateCategoryForm } from "@client/components/create-category-form";
import { Card, CardContent, CardHeader, CardTitle } from "@client/components/ui/card";
import { useAuth } from "@client/contexts/AuthContext";
import { useBoard } from "@client/contexts/BoardContext";
import { useToast } from "@client/contexts/ToastContext";
import { useBoardDrag } from "@client/hooks/use-board-drag";
import { useDragScroll } from "@client/hooks/use-drag-scroll";
import { useResizablePanel } from "@client/hooks/use-resizable-panel";
import {
  buildBoardMaps,
  createDefaultBoardFilters,
  createFilterPresetPayload,
  filterTasks,
  filtersFromPreset,
  getBoardMetrics,
  getBoardNotifications,
  groupTasksByCategory,
} from "@client/lib/board";
import { cn } from "@client/lib/cn";
import { getExpiryState } from "@client/lib/date";
import { getKeyboardMovePayload } from "@client/lib/task-keyboard-move";

type ConfirmationState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  onConfirm: () => Promise<void> | void;
} | null;

function LoadingState({ title, description }: { title: string; description: string }) {
  return (
    <main className="auth-shell">
      <Card className="auth-panel">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </main>
  );
}

function EmptyBoardState({ onCreateCategory }: { onCreateCategory: (name: string) => Promise<void> }) {
  return (
    <div className="board-empty-wrap">
      <Card className="board-empty-card">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">No stages yet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">Create a stage to start adding tickets back to the board.</p>
          <CreateCategoryForm onCreate={onCreateCategory} />
        </CardContent>
      </Card>
    </div>
  );
}

export function BoardPage() {
  const { logout } = useAuth();
  const {
    board,
    loading,
    selectedTask,
    selectedTaskId,
    setSelectedTaskId,
    createCategory,
    deleteCategory,
    createBadgeDefinition,
    updateBadgeDefinition,
    deleteBadgeDefinition,
    createFilterPreset,
    updateFilterPreset,
    deleteFilterPreset,
    createTask,
    moveTask,
    archiveTask,
    archiveTasks,
    trashTask,
    trashTasks,
    restoreTask,
    restoreTasks,
    deleteTask,
    deleteTasks,
  } = useBoard();
  const { addToast } = useToast();
  const [filters, setFilters] = useState(createDefaultBoardFilters());
  const [selectedFilterPresetId, setSelectedFilterPresetId] = useState("");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(window.innerWidth >= 1024);
  const [confirmation, setConfirmation] = useState<ConfirmationState>(null);
  const notifiedTaskIdsRef = useRef<Set<string>>(new Set());
  const { ref: boardScrollerRef, isDraggingSurface } = useDragScroll<HTMLDivElement>();
  const { width: sidebarWidth, isResizing, startResize } = useResizablePanel({
    initialWidth: 440,
    minWidth: 340,
    maxWidth: 820,
  });
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

    const handleResize = () => {
      setIsDesktopLayout(window.innerWidth >= 1024);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (selectedTask) {
      setIsSidebarOpen(true);
    }
  }, [selectedTask?.id]);

  useEffect(() => {
    if (!board) {
      return;
    }

    const nextNotifiedTaskIds = new Set<string>();
    const activeTasks = board.tasks.filter((task) => !task.archivedAt && !task.trashedAt);

    for (const task of activeTasks) {
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

  useEffect(() => {
    if (!board) {
      return;
    }

    if (selectedFilterPresetId && !board.filterPresets.some((preset) => preset.id === selectedFilterPresetId)) {
      setSelectedFilterPresetId("");
    }
  }, [board, selectedFilterPresetId]);

  if (loading || !board) {
    return <LoadingState description="Preparing your board." title="Loading" />;
  }

  const currentBoard = board;
  const categoryTaskCounts = currentBoard.tasks.reduce((counts, task) => {
    counts.set(task.categoryId, (counts.get(task.categoryId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  const {
    activeTasks,
    archivedTasks,
    trashedTasks,
    tasksByCategory,
    commentsByTask,
    badgesByTask,
    badgeIdsByTask,
    categoryNameMap,
    taskNameMap,
    commentCountMap,
  } = buildBoardMaps(board);
  const filteredActiveTasks = filterTasks(activeTasks, filters, badgesByTask);
  const filteredTasksByCategory = groupTasksByCategory(filteredActiveTasks, currentBoard.categories);
  const { totalTaskCount, dueSoonCount, overdueCount } = getBoardMetrics(filteredActiveTasks);
  const notifications = getBoardNotifications(activeTasks, categoryNameMap);
  const selectedTaskHistory = selectedTask ? currentBoard.history.filter((item) => item.taskId === selectedTask.id) : [];
  const selectedTaskComments = selectedTask ? commentsByTask.get(selectedTask.id) ?? [] : [];
  const selectedTaskBadgeIds = selectedTask ? badgeIdsByTask.get(selectedTask.id) ?? [] : [];

  function openConfirmation(nextConfirmation: ConfirmationState) {
    setConfirmation(nextConfirmation);
  }

  function handleFiltersChange(nextFilters: typeof filters) {
    setFilters(nextFilters);
    setSelectedFilterPresetId("");
  }

  function handleSelectTask(taskId: string) {
    startTransition(() => {
      setSelectedTaskId(taskId);
    });
    setIsSidebarOpen(true);
    setIsWorkspaceOpen(false);
  }

  function clearSelectedTaskIfAffected(taskIds: string[]) {
    if (!selectedTaskId || !taskIds.includes(selectedTaskId)) {
      return;
    }

    setIsSidebarOpen(false);
    startTransition(() => {
      setSelectedTaskId(null);
    });
  }

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

  async function handleSaveFilterPreset(name: string) {
    await createFilterPreset(createFilterPresetPayload(name, filters));
  }

  async function handleUpdateFilterPreset(presetId: string, name: string) {
    await updateFilterPreset(presetId, createFilterPresetPayload(name, filters));
  }

  function handleSelectFilterPreset(presetId: string) {
    setSelectedFilterPresetId(presetId);

    if (!presetId) {
      setFilters(createDefaultBoardFilters());
      return;
    }

    const preset = currentBoard.filterPresets.find((item) => item.id === presetId);

    if (!preset) {
      return;
    }

    setFilters(filtersFromPreset(preset));
  }

  function requestDeleteFilterPreset(presetId: string) {
    const presetName = currentBoard.filterPresets.find((preset) => preset.id === presetId)?.name ?? "Preset";

    openConfirmation({
      title: "Delete filter preset",
      description: `Delete "${presetName}"? You can save a new preset later if needed.`,
      confirmLabel: "Delete preset",
      tone: "danger",
      onConfirm: async () => {
        await deleteFilterPreset(presetId);
        setSelectedFilterPresetId("");
      },
    });
  }

  function requestDeleteCategory(categoryId: string) {
    const categoryName = categoryNameMap[categoryId] ?? "Stage";

    openConfirmation({
      title: "Delete empty stage",
      description: `Delete "${categoryName}"? This only works when the stage has no tickets at all.`,
      confirmLabel: "Delete stage",
      tone: "danger",
      onConfirm: () => deleteCategory(categoryId),
    });
  }

  function requestArchiveTask(taskId: string) {
    const taskTitle = taskNameMap[taskId] ?? "Task";

    openConfirmation({
      title: "Archive task",
      description: `Archive "${taskTitle}"? You can restore it later from the workspace archive list.`,
      confirmLabel: "Archive",
      onConfirm: async () => {
        await archiveTask(taskId);
        clearSelectedTaskIfAffected([taskId]);
      },
    });
  }

  async function handleArchiveTasks(taskIds: string[]) {
    await archiveTasks(taskIds);
    clearSelectedTaskIfAffected(taskIds);
  }

  function requestTrashTask(taskId: string) {
    const taskTitle = taskNameMap[taskId] ?? "Task";

    openConfirmation({
      title: "Move task to trash",
      description: `Move "${taskTitle}" to trash? It will stay there for 30 days before automatic removal.`,
      confirmLabel: "Move to trash",
      tone: "danger",
      onConfirm: async () => {
        await trashTask(taskId);
        clearSelectedTaskIfAffected([taskId]);
      },
    });
  }

  async function handleTrashTasks(taskIds: string[]) {
    await trashTasks(taskIds);
    clearSelectedTaskIfAffected(taskIds);
  }

  function requestRestoreTask(taskId: string) {
    const taskTitle = taskNameMap[taskId] ?? "Task";

    openConfirmation({
      title: "Restore task",
      description: `Restore "${taskTitle}" back to the board?`,
      confirmLabel: "Restore",
      onConfirm: () => restoreTask(taskId),
    });
  }

  async function handleRestoreTasks(taskIds: string[]) {
    await restoreTasks(taskIds);
  }

  function requestDeleteTask(taskId: string) {
    const taskTitle = taskNameMap[taskId] ?? "Task";

    openConfirmation({
      title: "Delete task now",
      description: `Delete "${taskTitle}" permanently? This action cannot be undone.`,
      confirmLabel: "Delete permanently",
      tone: "danger",
      onConfirm: () => deleteTask(taskId),
    });
  }

  async function handleDeleteTasks(taskIds: string[]) {
    await deleteTasks(taskIds);
    clearSelectedTaskIfAffected(taskIds);
  }

  function requestDeleteBadge(badgeId: string) {
    const badgeTitle = currentBoard.badgeDefinitions.find((badgeDefinition) => badgeDefinition.id === badgeId)?.title ?? "Badge";

    openConfirmation({
      title: "Remove badge",
      description: `Remove "${badgeTitle}" from the badge repository? The badge will also be removed from tasks using it.`,
      confirmLabel: "Remove badge",
      tone: "danger",
      onConfirm: () => deleteBadgeDefinition(badgeId),
    });
  }

  async function handleTaskKeyboardMove(taskId: string, direction: "up" | "down" | "left" | "right") {
    const payload = getKeyboardMovePayload(taskId, direction, currentBoard.categories, tasksByCategory);

    if (!payload) {
      return;
    }

    await moveTask(taskId, payload);
  }

  const sidebarVisible = !isFocusMode && isSidebarOpen;

  return (
    <main className="board-shell">
      <BoardHeader
        categoryAction={<CreateCategoryForm onCreate={createCategory} size="sm" />}
        dueSoonCount={dueSoonCount}
        filtersBar={
          <BoardFilters
            badgeDefinitions={currentBoard.badgeDefinitions}
            filters={filters}
            onClear={() => {
              setFilters(createDefaultBoardFilters());
              setSelectedFilterPresetId("");
            }}
            onDeletePreset={requestDeleteFilterPreset}
            onFiltersChange={handleFiltersChange}
            onSavePreset={handleSaveFilterPreset}
            onSelectPreset={handleSelectFilterPreset}
            onUpdatePreset={handleUpdateFilterPreset}
            presets={currentBoard.filterPresets}
            resultCount={filteredActiveTasks.length}
            selectedPresetId={selectedFilterPresetId}
          />
        }
        isDragging={isDragging}
        isFocusMode={isFocusMode}
        isFullscreen={isFullscreen}
        onLogout={handleLogout}
        onOpenWorkspace={() => setIsWorkspaceOpen(true)}
        onToggleFocusMode={() => setIsFocusMode((current) => !current)}
        onToggleFullscreen={handleToggleFullscreen}
        overdueCount={overdueCount}
        totalTaskCount={totalTaskCount}
      />

      <div className="board-page-body">
        <div ref={boardScrollerRef} className={cn("board-scroll-frame", isDraggingSurface ? "cursor-grabbing" : "cursor-grab")}>
          {currentBoard.categories.length === 0 ? (
            <EmptyBoardState onCreateCategory={createCategory} />
          ) : (
            <div className="board-stage">
              {currentBoard.categories.map((category) => (
                <BoardColumn
                  key={category.id}
                  badgesByTask={badgesByTask}
                  canDelete={(categoryTaskCounts.get(category.id) ?? 0) === 0}
                  category={category}
                  commentCountMap={commentCountMap}
                  draggingTaskId={draggingTaskId}
                  dropTarget={dropTarget}
                  onCreateTask={createTask}
                  onDropPreview={handleDropPreview}
                  onDropTask={handleDropTask}
                  onRequestDeleteCategory={requestDeleteCategory}
                  onTaskDragEnd={handleTaskDragEnd}
                  onTaskDragStart={handleTaskDragStart}
                  onTaskKeyboardMove={handleTaskKeyboardMove}
                  onTaskSelect={handleSelectTask}
                  selectedTaskId={selectedTaskId}
                  tasks={filteredTasksByCategory.get(category.id) ?? []}
                />
              ))}
            </div>
          )}
        </div>

        {sidebarVisible ? (
          <aside
            className={cn("inspector-shell", isDesktopLayout ? "left-auto border-l" : "inset-x-0 border-t")}
            style={isDesktopLayout ? { width: `${sidebarWidth}px` } : undefined}
          >
            {isDesktopLayout ? (
              <button
                aria-label="Resize details panel"
                className={cn("absolute left-0 top-0 h-full w-2 -translate-x-1/2 cursor-col-resize bg-transparent", isResizing && "bg-primary/10")}
                onMouseDown={startResize}
                type="button"
              />
            ) : null}

            <BoardSidebar
              badgeDefinitions={currentBoard.badgeDefinitions}
              boardHistory={currentBoard.history}
              categoryNameMap={categoryNameMap}
              notifications={notifications}
              onClose={() => {
                setIsSidebarOpen(false);
                startTransition(() => {
                  setSelectedTaskId(null);
                });
              }}
              onRequestArchiveTask={requestArchiveTask}
              onRequestTrashTask={requestTrashTask}
              onSelectTask={handleSelectTask}
              selectedTask={selectedTask}
              selectedTaskBadgeIds={selectedTaskBadgeIds}
              selectedTaskComments={selectedTaskComments}
              selectedTaskHistory={selectedTaskHistory}
              taskNameMap={taskNameMap}
            />
          </aside>
        ) : null}
      </div>

      <BoardWorkspace
        activeTasks={activeTasks}
        archivedTasks={archivedTasks}
        badgeDefinitions={currentBoard.badgeDefinitions}
        badgesByTask={badgesByTask}
        categoryNameMap={categoryNameMap}
        onArchiveTask={requestArchiveTask}
        onArchiveTasks={handleArchiveTasks}
        onClose={() => setIsWorkspaceOpen(false)}
        onCreateBadge={createBadgeDefinition}
        onDeleteBadge={requestDeleteBadge}
        onDeleteTask={requestDeleteTask}
        onDeleteTasks={handleDeleteTasks}
        onRestoreTask={requestRestoreTask}
        onRestoreTasks={handleRestoreTasks}
        onSelectTask={handleSelectTask}
        onTrashTask={requestTrashTask}
        onTrashTasks={handleTrashTasks}
        onUpdateBadge={updateBadgeDefinition}
        open={isWorkspaceOpen}
        trashedTasks={trashedTasks}
      />

      <ConfirmationDialog
        confirmLabel={confirmation?.confirmLabel ?? "Confirm"}
        description={confirmation?.description ?? ""}
        onClose={() => setConfirmation(null)}
        onConfirm={async () => {
          if (!confirmation) {
            return;
          }

          await confirmation.onConfirm();
          setConfirmation(null);
        }}
        open={Boolean(confirmation)}
        title={confirmation?.title ?? "Confirm action"}
        tone={confirmation?.tone}
      />
    </main>
  );
}
