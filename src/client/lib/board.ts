import type { Board, TaskComment, TaskHistory } from "@shared/api";
import { getExpiryState } from "@client/lib/date";

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
  const commentsByTask = new Map<string, TaskComment[]>();
  const categoryNameMap: Record<string, string> = {};
  const taskNameMap: Record<string, string> = {};
  const commentCountMap: Record<string, number> = {};

  for (const category of board.categories) {
    tasksByCategory.set(category.id, []);
    categoryNameMap[category.id] = category.name;
  }

  for (const task of board.tasks) {
    taskNameMap[task.id] = task.title;
    commentCountMap[task.id] = 0;
    commentsByTask.set(task.id, []);
    tasksByCategory.get(task.categoryId)?.push(task);
  }

  for (const comment of board.comments) {
    const taskComments = commentsByTask.get(comment.taskId);

    if (!taskComments) {
      continue;
    }

    taskComments.push(comment);
    commentCountMap[comment.taskId] = (commentCountMap[comment.taskId] ?? 0) + 1;
  }

  return {
    tasksByCategory,
    commentsByTask,
    categoryNameMap,
    taskNameMap,
    commentCountMap,
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

  if (item.action === "commented") {
    return "Added a comment";
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

  if (item.action === "commented") {
    return "Comment added";
  }

  return item.note ?? "Task created";
}
