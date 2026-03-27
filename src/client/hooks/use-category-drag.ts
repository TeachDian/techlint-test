import { useRef, useState, type DragEvent } from "react";
import type { MoveCategoryPayload } from "@shared/api";
import { attachDragPreview } from "@client/lib/drag-preview";

type CategoryDragPayload = {
  kind: "category";
  categoryId: string;
  index: number;
};

type UseCategoryDragOptions = {
  onMoveCategory: (categoryId: string, payload: MoveCategoryPayload) => Promise<void>;
  onMoveError: () => void;
};

function isCategoryDragPayload(value: unknown): value is CategoryDragPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<CategoryDragPayload>;
  return payload.kind === "category" && typeof payload.categoryId === "string" && typeof payload.index === "number";
}

function writeCategoryPayload(event: DragEvent<HTMLElement>, payload: CategoryDragPayload) {
  const rawPayload = JSON.stringify(payload);
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("application/x-board-category", rawPayload);
  event.dataTransfer.setData("text/plain", rawPayload);
}

export function readCategoryPayload(event: DragEvent<HTMLElement>) {
  const rawPayload = event.dataTransfer.getData("application/x-board-category") || event.dataTransfer.getData("text/plain");

  if (!rawPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawPayload) as unknown;
    return isCategoryDragPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function resolveCategoryPosition(payload: CategoryDragPayload, targetIndex: number) {
  return payload.index < targetIndex ? targetIndex - 1 : targetIndex;
}

export function useCategoryDrag({ onMoveCategory, onMoveError }: UseCategoryDragOptions) {
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const cleanupPreviewRef = useRef<() => void>(() => {});

  function handleCategoryDragStart(event: DragEvent<HTMLElement>, categoryId: string, index: number, categoryName: string) {
    cleanupPreviewRef.current();
    cleanupPreviewRef.current = attachDragPreview(event, categoryName, "stage");
    setDraggingCategoryId(categoryId);
    writeCategoryPayload(event, { kind: "category", categoryId, index });
  }

  function handleCategoryDragEnd() {
    cleanupPreviewRef.current();
    cleanupPreviewRef.current = () => {};
    setDraggingCategoryId(null);
    setDropIndex(null);
  }

  function handleCategoryDropPreview(index: number | null) {
    setDropIndex(index);
  }

  async function handleCategoryDrop(event: DragEvent<HTMLElement>, targetIndex: number) {
    event.preventDefault();
    const payload = readCategoryPayload(event);
    handleCategoryDragEnd();

    if (!payload) {
      return;
    }

    const nextPosition = resolveCategoryPosition(payload, targetIndex);

    if (payload.index === nextPosition) {
      return;
    }

    try {
      await onMoveCategory(payload.categoryId, { position: Math.max(0, nextPosition) });
    } catch {
      onMoveError();
    }
  }

  return {
    draggingCategoryId,
    categoryDropIndex: dropIndex,
    isDraggingCategory: draggingCategoryId !== null,
    handleCategoryDragStart,
    handleCategoryDragEnd,
    handleCategoryDropPreview,
    handleCategoryDrop,
  };
}
