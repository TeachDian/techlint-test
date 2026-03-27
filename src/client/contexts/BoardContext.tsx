import { startTransition, createContext, useContext, useEffect, useState } from "react";
import type { Board, CreateTaskCommentPayload, CreateTaskPayload, MoveTaskPayload, Task, UpdateTaskPayload } from "@shared/api";
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
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (taskId: string, payload: UpdateTaskPayload) => Promise<void>;
  moveTask: (taskId: string, payload: MoveTaskPayload) => Promise<void>;
  createTaskComment: (taskId: string, payload: CreateTaskCommentPayload) => Promise<void>;
};

const BoardContext = createContext<BoardContextValue | null>(null);

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
    replaceBoard(result.board);
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
        createTask,
        updateTask,
        moveTask,
        createTaskComment,
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
