import { useRef, useState } from "react";
import type { DragEvent } from "react";
import type { MoveTaskPayload } from "@shared/api";
import { attachDragPreview } from "@client/lib/drag-preview";

export type DragPayload = {
  kind: "task";
  taskId: string;
  categoryId: string;
  index: number;
};

export type DropMode = "before" | "after" | "swap";

export type DropTarget = {
  categoryId: string;
  index: number;
  taskId: string | null;
  mode: DropMode;
} | null;

type UseBoardDragOptions = {
  onMoveTask: (taskId: string, payload: MoveTaskPayload) => Promise<void>;
  onMoveError: () => void;
};

function isDragPayload(value: unknown): value is DragPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<DragPayload>;
  return payload.kind === "task" && typeof payload.taskId === "string" && typeof payload.categoryId === "string" && typeof payload.index === "number";
}

export function createDragPayload(taskId: string, categoryId: string, index: number): DragPayload {
  return { kind: "task", taskId, categoryId, index };
}

export function createDropTarget(categoryId: string, index: number, mode: DropMode, taskId: string | null = null): Exclude<DropTarget, null> {
  return { categoryId, index, mode, taskId };
}

export function writeDragPayload(event: DragEvent<HTMLElement>, payload: DragPayload) {
  const rawPayload = JSON.stringify(payload);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-board-task", rawPayload);
  event.dataTransfer.setData("application/json", rawPayload);
  event.dataTransfer.setData("text/plain", rawPayload);
}

export function readDragPayload(event: DragEvent<HTMLElement>) {
  const rawPayload = event.dataTransfer.getData("application/x-board-task") || event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");

  if (!rawPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawPayload) as unknown;
    return isDragPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function resolveCardDropMode(pointerOffsetY: number, cardHeight: number): DropMode {
  const ratio = cardHeight <= 0 ? 0.5 : pointerOffsetY / cardHeight;

  if (ratio <= 0.4) {
    return "before";
  }

  if (ratio >= 0.6) {
    return "after";
  }

  return "swap";
}

export function resolveDropIndex(payload: DragPayload, target: Exclude<DropTarget, null>) {
  const baseIndex = target.mode === "after" ? target.index + 1 : target.index;
  return payload.categoryId === target.categoryId && payload.index < baseIndex ? baseIndex - 1 : baseIndex;
}

export function resolveMovePayload(payload: DragPayload, target: Exclude<DropTarget, null>): MoveTaskPayload | null {
  if (target.mode === "swap") {
    if (!target.taskId || target.taskId === payload.taskId) {
      return null;
    }

    return {
      categoryId: target.categoryId,
      position: target.index,
      swapWithTaskId: target.taskId,
    };
  }

  const nextIndex = resolveDropIndex(payload, target);

  if (payload.categoryId === target.categoryId && payload.index === nextIndex) {
    return null;
  }

  return {
    categoryId: target.categoryId,
    position: Math.max(0, nextIndex),
  };
}

export function useBoardDrag({ onMoveTask, onMoveError }: UseBoardDragOptions) {
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const cleanupPreviewRef = useRef<() => void>(() => {});

  function handleTaskDragStart(event: DragEvent<HTMLElement>, taskId: string, categoryId: string, index: number, taskTitle: string) {
    cleanupPreviewRef.current();
    cleanupPreviewRef.current = attachDragPreview(event, taskTitle, "task");
    setDraggingTaskId(taskId);
    writeDragPayload(event, createDragPayload(taskId, categoryId, index));
  }

  function handleDropPreview(target: DropTarget) {
    setDropTarget(target);
  }

  function handleTaskDragEnd() {
    cleanupPreviewRef.current();
    cleanupPreviewRef.current = () => {};
    setDropTarget(null);
    setDraggingTaskId(null);
  }

  async function handleDropTask(event: DragEvent<HTMLElement>, target: Exclude<DropTarget, null>) {
    event.preventDefault();
    const payload = readDragPayload(event);
    handleTaskDragEnd();

    if (!payload) {
      return;
    }

    const movePayload = resolveMovePayload(payload, target);

    if (!movePayload) {
      return;
    }

    try {
      await onMoveTask(payload.taskId, movePayload);
    } catch {
      onMoveError();
    }
  }

  return {
    dropTarget,
    draggingTaskId,
    isDragging: draggingTaskId !== null,
    handleTaskDragStart,
    handleTaskDragEnd,
    handleDropPreview,
    handleDropTask,
    clearDropTarget: () => setDropTarget(null),
  };
}
