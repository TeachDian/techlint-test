import { useState } from "react";
import type { DragEvent } from "react";
import type { MoveTaskPayload } from "@shared/api";

export type DragPayload = {
  taskId: string;
  categoryId: string;
  index: number;
};

export type DropTarget = {
  categoryId: string;
  index: number;
} | null;

type UseBoardDragOptions = {
  onMoveTask: (taskId: string, payload: MoveTaskPayload) => Promise<void>;
  onMoveError: () => void;
};

export function createDragPayload(taskId: string, categoryId: string, index: number): DragPayload {
  return { taskId, categoryId, index };
}

export function writeDragPayload(event: DragEvent<HTMLElement>, payload: DragPayload) {
  const rawPayload = JSON.stringify(payload);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/json", rawPayload);
  event.dataTransfer.setData("text/plain", rawPayload);
}

export function readDragPayload(event: DragEvent<HTMLElement>) {
  const rawPayload = event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");

  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload) as DragPayload;
  } catch {
    return null;
  }
}

export function resolveDropIndex(payload: DragPayload, categoryId: string, index: number) {
  return payload.categoryId === categoryId && payload.index < index ? index - 1 : index;
}

export function useBoardDrag({ onMoveTask, onMoveError }: UseBoardDragOptions) {
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  function handleTaskDragStart(event: DragEvent<HTMLElement>, taskId: string, categoryId: string, index: number) {
    setDraggingTaskId(taskId);
    writeDragPayload(event, createDragPayload(taskId, categoryId, index));
  }

  function handleDropPreview(target: DropTarget) {
    setDropTarget(target);
  }

  function handleTaskDragEnd() {
    setDropTarget(null);
    setDraggingTaskId(null);
  }

  async function handleDropTask(event: DragEvent<HTMLDivElement>, categoryId: string, index: number) {
    event.preventDefault();
    const payload = readDragPayload(event);
    setDropTarget(null);
    setDraggingTaskId(null);

    if (!payload) {
      return;
    }

    const nextIndex = resolveDropIndex(payload, categoryId, index);

    if (payload.categoryId === categoryId && payload.index === nextIndex) {
      return;
    }

    try {
      await onMoveTask(payload.taskId, {
        categoryId,
        position: Math.max(0, nextIndex),
      });
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
