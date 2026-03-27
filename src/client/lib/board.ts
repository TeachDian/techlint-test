import type { DragEvent } from "react";
import type { Board, TaskHistory } from "@shared/api";
import { getExpiryState } from "@client/lib/date";

export type DragPayload = {
  taskId: string;
  categoryId: string;
  index: number;
};

export type DropTarget = {
  categoryId: string;
  index: number;
} | null;

export type BoardNotification = {
  taskId: string;
  title: string;
  categoryName: string;
  expiryAt: string | null;
  tone: "warning" | "overdue";
  detail: string;
};

export function buildBoardMaps(board: Board) {
  const tasksByCategory = new Map<string, typeof board.tasks>();
  const categoryNameMap: Record<string, string> = {};
  const taskNameMap: Record<string, string> = {};

  for (const category of board.categories) {
    tasksByCategory.set(category.id, []);
    categoryNameMap[category.id] = category.name;
  }

  for (const task of board.tasks) {
    taskNameMap[task.id] = task.title;
    tasksByCategory.get(task.categoryId)?.push(task);
  }

  return {
    tasksByCategory,
    categoryNameMap,
    taskNameMap,
  };
}

export function getBoardMetrics(board: Board) {
  return board.tasks.reduce(
    (metrics, task) => {
      const expiry = getExpiryState(task.expiryAt);

      if (expiry.tone === "warning") {
        metrics.dueSoonCount += 1;
      }

      if (expiry.tone === "overdue") {
        metrics.overdueCount += 1;
      }

      return metrics;
    },
    {
      totalTaskCount: board.tasks.length,
      dueSoonCount: 0,
      overdueCount: 0,
    },
  );
}

export function getBoardNotifications(board: Board, categoryNameMap: Record<string, string>) {
  const notifications: BoardNotification[] = [];

  for (const task of board.tasks) {
    const expiry = getExpiryState(task.expiryAt);

    if (!expiry.isNearExpiry) {
      continue;
    }

    notifications.push({
      taskId: task.id,
      title: task.title,
      categoryName: categoryNameMap[task.categoryId] ?? "Unknown",
      expiryAt: task.expiryAt,
      tone: expiry.isOverdue ? "overdue" : "warning",
      detail: expiry.detail ?? expiry.label,
    });
  }

  notifications.sort((left, right) => {
    if (left.tone !== right.tone) {
      return left.tone === "overdue" ? -1 : 1;
    }

    const leftTime = left.expiryAt ? new Date(left.expiryAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightTime = right.expiryAt ? new Date(right.expiryAt).getTime() : Number.MAX_SAFE_INTEGER;
    return leftTime - rightTime;
  });

  return notifications;
}

export function describeActivity(item: TaskHistory, categoryNameMap: Record<string, string>) {
  if (item.action === "moved") {
    return `Moved to ${categoryNameMap[item.toCategoryId ?? ""] ?? "Unknown"}`;
  }

  if (item.action === "reordered") {
    return "Reordered inside the same column";
  }

  if (item.action === "updated") {
    return "Updated task details";
  }

  return item.note ?? "Task created";
}

export function describeHistoryItem(item: TaskHistory, categoryNameMap: Record<string, string>) {
  if (item.action === "moved") {
    return `Moved from ${categoryNameMap[item.fromCategoryId ?? ""] ?? "Unknown"} to ${categoryNameMap[item.toCategoryId ?? ""] ?? "Unknown"}`;
  }

  if (item.action === "reordered") {
    return "Task order changed";
  }

  if (item.action === "updated") {
    return "Task details updated";
  }

  return item.note ?? "Task created";
}

export function readDragPayload(event: DragEvent<HTMLDivElement>) {
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
