import { startTransition, createContext, useContext, useEffect, useState } from "react";
import type {
  Board,
  CreateBadgeDefinitionPayload,
  CreateBoardFilterPresetPayload,
  CreateTaskCommentPayload,
  CreateTaskPayload,
  MoveTaskPayload,
  Task,
  UpdateBadgeDefinitionPayload,
  UpdateBoardFilterPresetPayload,
  UpdateTaskPayload,
} from "@shared/api";
import { api } from "@client/lib/api";
import { useToast } from "@client/contexts/ToastContext";

type BoardContextValue = {
  board: Board | null;
  loading: boolean;
  selectedTaskId: string | null;
  selectedTask: Task | null;
  setSelectedTaskId: (taskId: string | null) => void;
  refreshBoard: () => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  createBadgeDefinition: (payload: CreateBadgeDefinitionPayload) => Promise<void>;
  updateBadgeDefinition: (badgeId: string, payload: UpdateBadgeDefinitionPayload) => Promise<void>;
  deleteBadgeDefinition: (badgeId: string) => Promise<void>;
  createFilterPreset: (payload: CreateBoardFilterPresetPayload) => Promise<void>;
  updateFilterPreset: (presetId: string, payload: UpdateBoardFilterPresetPayload) => Promise<void>;
  deleteFilterPreset: (presetId: string) => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<void>;
  moveTask: (taskId: string, payload: MoveTaskPayload) => Promise<void>;
  createTaskComment: (taskId: string, payload: CreateTaskCommentPayload) => Promise<void>;
  archiveTask: (taskId: string) => Promise<void>;
  archiveTasks: (taskIds: string[]) => Promise<void>;
  trashTask: (taskId: string) => Promise<void>;
  trashTasks: (taskIds: string[]) => Promise<void>;
  restoreTask: (taskId: string) => Promise<void>;
  restoreTasks: (taskIds: string[]) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  deleteTasks: (taskIds: string[]) => Promise<void>;
};

const BoardContext = createContext<BoardContextValue | null>(null);

function getTaskTitle(board: Board, taskId: string) {
  return board.tasks.find((task) => task.id === taskId)?.title ?? "Task";
}

function getCategoryName(board: Board, categoryId: string) {
  return board.categories.find((category) => category.id === categoryId)?.name ?? "Unknown";
}

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const { addToast } = useToast();
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  function replaceBoard(nextBoard: Board) {
    startTransition(() => {
      setBoard(nextBoard);
      setSelectedTaskId((currentTaskId) => {
        if (!currentTaskId) {
          return currentTaskId;
        }

        return nextBoard.tasks.some((task) => task.id === currentTaskId) ? currentTaskId : null;
      });
    });
  }

  async function refreshBoard() {
    try {
      setLoading(true);
      const result = await api.getBoard();
      replaceBoard(result.board);
    } catch (_error) {
      addToast({
        title: "Board load failed",
        description: "Please refresh the page and try again.",
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  async function createCategory(name: string) {
    const result = await api.createCategory({ name });
    replaceBoard(result.board);
    addToast({
      title: "Category created",
      description: `"${name}" is ready for new tasks.`,
      tone: "success",
    });
  }

  async function createBadgeDefinition(payload: CreateBadgeDefinitionPayload) {
    const result = await api.createBadgeDefinition(payload);
    replaceBoard(result.board);
    addToast({
      title: "Badge created",
      description: `"${payload.title}" is now available for tasks.`,
      tone: "success",
    });
  }

  async function updateBadgeDefinition(badgeId: string, payload: UpdateBadgeDefinitionPayload) {
    const result = await api.updateBadgeDefinition(badgeId, payload);
    replaceBoard(result.board);
    addToast({
      title: "Badge updated",
      description: `"${payload.title}" was updated.`,
      tone: "success",
    });
  }

  async function deleteBadgeDefinition(badgeId: string) {
    if (!board) {
      return;
    }

    const badgeTitle = board.badgeDefinitions.find((badge) => badge.id === badgeId)?.title ?? "Badge";
    const result = await api.deleteBadgeDefinition(badgeId);
    replaceBoard(result.board);
    addToast({
      title: "Badge removed",
      description: `"${badgeTitle}" was removed from the badge list.`,
      tone: "warning",
    });
  }

  async function createFilterPreset(payload: CreateBoardFilterPresetPayload) {
    const result = await api.createFilterPreset(payload);
    replaceBoard(result.board);
    addToast({
      title: "Preset saved",
      description: `"${payload.name}" is ready to reuse.`,
      tone: "success",
    });
  }

  async function updateFilterPreset(presetId: string, payload: UpdateBoardFilterPresetPayload) {
    const result = await api.updateFilterPreset(presetId, payload);
    replaceBoard(result.board);
    addToast({
      title: "Preset updated",
      description: `"${payload.name}" now uses the latest filters.`,
      tone: "success",
    });
  }

  async function deleteFilterPreset(presetId: string) {
    const presetName = board?.filterPresets.find((preset) => preset.id === presetId)?.name ?? "Preset";
    const result = await api.deleteFilterPreset(presetId);
    replaceBoard(result.board);
    addToast({
      title: "Preset removed",
      description: `"${presetName}" was deleted.`,
      tone: "warning",
    });
  }

  async function createTask(payload: CreateTaskPayload) {
    const result = await api.createTask(payload);
    replaceBoard(result.board);
    addToast({
      title: "Task created",
      description: `"${payload.title}" was added to the board.`,
      tone: "success",
    });
  }

  async function updateTask(taskId: string, payload: UpdateTaskPayload) {
    const result = await api.updateTask(taskId, payload);
    replaceBoard(result.board);
  }

  async function moveTask(taskId: string, payload: MoveTaskPayload) {
    const result = await api.moveTask(taskId, payload);
    const taskTitle = getTaskTitle(result.board, taskId);
    const categoryName = getCategoryName(result.board, payload.categoryId);
    replaceBoard(result.board);
    addToast({
      title: payload.swapWithTaskId ? "Task swapped" : "Stage updated",
      description: payload.swapWithTaskId ? `"${taskTitle}" swapped position.` : `"${taskTitle}" moved to ${categoryName}.`,
      tone: "success",
    });
  }

  async function createTaskComment(taskId: string, payload: CreateTaskCommentPayload) {
    const result = await api.createTaskComment(taskId, payload);
    replaceBoard(result.board);
    addToast({
      title: "Comment added",
      description: "The task comment was saved.",
      tone: "success",
    });
  }

  async function archiveTask(taskId: string) {
    const result = await api.archiveTask(taskId);
    const taskTitle = getTaskTitle(result.board, taskId);
    replaceBoard(result.board);
    addToast({
      title: "Task archived",
      description: `"${taskTitle}" moved to archive.`,
      tone: "warning",
    });
  }

  async function trashTask(taskId: string) {
    const result = await api.trashTask(taskId);
    const taskTitle = getTaskTitle(result.board, taskId);
    replaceBoard(result.board);
    addToast({
      title: "Task moved to trash",
      description: `"${taskTitle}" will stay in trash for 30 days.`,
      tone: "warning",
    });
  }

  async function restoreTask(taskId: string) {
    const result = await api.restoreTask(taskId);
    const taskTitle = getTaskTitle(result.board, taskId);
    replaceBoard(result.board);
    addToast({
      title: "Task restored",
      description: `"${taskTitle}" is back on the board.`,
      tone: "success",
    });
  }

  async function deleteTask(taskId: string) {
    const titleFromCurrentBoard = board ? getTaskTitle(board, taskId) : "Task";
    const result = await api.deleteTask(taskId);
    replaceBoard(result.board);
    addToast({
      title: "Task deleted",
      description: `"${titleFromCurrentBoard}" was removed permanently.`,
      tone: "danger",
    });
  }

  async function runTaskBatch(
    taskIds: string[],
    requestAction: (taskId: string) => Promise<{ board: Board }>,
    successTitle: string,
    successDescription: string,
    tone: "success" | "warning" | "danger",
  ) {
    const uniqueTaskIds = [...new Set(taskIds.filter(Boolean))];

    if (uniqueTaskIds.length === 0) {
      return;
    }

    let latestBoard: Board | null = null;

    for (const taskId of uniqueTaskIds) {
      const result = await requestAction(taskId);
      latestBoard = result.board;
    }

    if (latestBoard) {
      replaceBoard(latestBoard);
    }

    addToast({
      title: successTitle,
      description: successDescription,
      tone,
    });
  }

  async function archiveTasks(taskIds: string[]) {
    await runTaskBatch(taskIds, (taskId) => api.archiveTask(taskId), "Tasks archived", `${taskIds.length} task${taskIds.length === 1 ? "" : "s"} moved to archive.`, "warning");
  }

  async function trashTasks(taskIds: string[]) {
    await runTaskBatch(taskIds, (taskId) => api.trashTask(taskId), "Tasks moved to trash", `${taskIds.length} task${taskIds.length === 1 ? "" : "s"} moved to trash.`, "warning");
  }

  async function restoreTasks(taskIds: string[]) {
    await runTaskBatch(taskIds, (taskId) => api.restoreTask(taskId), "Tasks restored", `${taskIds.length} task${taskIds.length === 1 ? "" : "s"} restored to the board.`, "success");
  }

  async function deleteTasks(taskIds: string[]) {
    await runTaskBatch(taskIds, (taskId) => api.deleteTask(taskId), "Tasks deleted", `${taskIds.length} task${taskIds.length === 1 ? "" : "s"} deleted permanently.`, "danger");
  }

  useEffect(() => {
    void refreshBoard();
  }, []);

  const selectedTask = board?.tasks.find((task) => task.id === selectedTaskId) ?? null;

  return (
    <BoardContext.Provider
      value={{
        board,
        loading,
        selectedTaskId,
        selectedTask,
        setSelectedTaskId,
        refreshBoard,
        createCategory,
        createBadgeDefinition,
        updateBadgeDefinition,
        deleteBadgeDefinition,
        createFilterPreset,
        updateFilterPreset,
        deleteFilterPreset,
        createTask,
        updateTask,
        moveTask,
        createTaskComment,
        archiveTask,
        archiveTasks,
        trashTask,
        trashTasks,
        restoreTask,
        restoreTasks,
        deleteTask,
        deleteTasks,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);

  if (!context) {
    throw new Error("useBoard must be used inside BoardProvider.");
  }

  return context;
}
