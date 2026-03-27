import type { BadgeDefinition, Board, BoardFilterPreset, CreateBoardFilterPresetPayload, Priority, Task, TaskComment, TaskHistory } from "@shared/api";
import { getExpiryState } from "@client/lib/date";

export type BoardNotification = {
  taskId: string;
  title: string;
  categoryName: string;
  expiryAt: string | null;
  tone: "warning" | "overdue";
  detail: string;
};

export type BoardFilters = {
  query: string;
  startDate: string;
  endDate: string;
  priority: Priority | "all";
  badgeId: string;
};

export function createDefaultBoardFilters(): BoardFilters {
  return {
    query: "",
    startDate: "",
    endDate: "",
    priority: "all",
    badgeId: "",
  };
}

export function filtersFromPreset(preset: BoardFilterPreset): BoardFilters {
  return {
    query: preset.query,
    startDate: preset.startDate,
    endDate: preset.endDate,
    priority: preset.priority ?? "all",
    badgeId: preset.badgeId ?? "",
  };
}

export function createFilterPresetPayload(name: string, filters: BoardFilters): CreateBoardFilterPresetPayload {
  return {
    name: name.trim(),
    query: filters.query,
    startDate: filters.startDate,
    endDate: filters.endDate,
    priority: filters.priority === "all" ? null : filters.priority,
    badgeId: filters.badgeId || null,
  };
}

export function buildBoardMaps(board: Board) {
  const activeTasks = board.tasks.filter((task) => !task.archivedAt && !task.trashedAt);
  const archivedTasks = board.tasks.filter((task) => Boolean(task.archivedAt) && !task.trashedAt);
  const trashedTasks = board.tasks.filter((task) => Boolean(task.trashedAt));
  const tasksByCategory = new Map<string, Task[]>();
  const commentsByTask = new Map<string, TaskComment[]>();
  const badgeDefinitionMap = new Map<string, BadgeDefinition>();
  const badgesByTask = new Map<string, BadgeDefinition[]>();
  const badgeIdsByTask = new Map<string, string[]>();
  const categoryNameMap: Record<string, string> = {};
  const taskNameMap: Record<string, string> = {};
  const commentCountMap: Record<string, number> = {};

  for (const category of board.categories) {
    tasksByCategory.set(category.id, []);
    categoryNameMap[category.id] = category.name;
  }

  for (const badgeDefinition of board.badgeDefinitions) {
    badgeDefinitionMap.set(badgeDefinition.id, badgeDefinition);
  }

  for (const task of board.tasks) {
    taskNameMap[task.id] = task.title;
    commentCountMap[task.id] = 0;
    commentsByTask.set(task.id, []);
    badgeIdsByTask.set(task.id, []);
    badgesByTask.set(task.id, []);
  }

  for (const task of activeTasks) {
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

  for (const taskBadge of board.taskBadges) {
    const taskBadgeIds = badgeIdsByTask.get(taskBadge.taskId);
    const taskBadges = badgesByTask.get(taskBadge.taskId);
    const badgeDefinition = badgeDefinitionMap.get(taskBadge.badgeId);

    if (!taskBadgeIds || !taskBadges || !badgeDefinition) {
      continue;
    }

    taskBadgeIds.push(taskBadge.badgeId);
    taskBadges.push(badgeDefinition);
  }

  return {
    activeTasks,
    archivedTasks,
    trashedTasks,
    tasksByCategory,
    commentsByTask,
    badgesByTask,
    badgeIdsByTask,
    badgeDefinitionMap,
    categoryNameMap,
    taskNameMap,
    commentCountMap,
  };
}

export function filterTasks(tasks: Task[], filters: BoardFilters, badgesByTask: Map<string, BadgeDefinition[]>) {
  const query = filters.query.trim().toLowerCase();
  const startTime = filters.startDate ? new Date(filters.startDate).getTime() : null;
  const endTime = filters.endDate ? new Date(filters.endDate).getTime() : null;

  return tasks.filter((task) => {
    if (filters.priority !== "all" && task.priority !== filters.priority) {
      return false;
    }

    const taskBadges = badgesByTask.get(task.id) ?? [];

    if (filters.badgeId && !taskBadges.some((badge) => badge.id === filters.badgeId)) {
      return false;
    }

    if (query) {
      const badgeText = taskBadges.map((badge) => `${badge.title} ${badge.description}`).join(" ").toLowerCase();
      const haystack = `${task.title} ${task.description} ${badgeText}`.toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (startTime !== null || endTime !== null) {
      if (!task.expiryAt) {
        return false;
      }

      const expiryTime = new Date(task.expiryAt).getTime();

      if (startTime !== null && expiryTime < startTime) {
        return false;
      }

      if (endTime !== null && expiryTime > endTime + 24 * 60 * 60 * 1000 - 1) {
        return false;
      }
    }

    return true;
  });
}

export function groupTasksByCategory(tasks: Task[], categories: Board["categories"]) {
  const tasksByCategory = new Map<string, Task[]>();

  categories.forEach((category) => {
    tasksByCategory.set(category.id, []);
  });

  tasks.forEach((task) => {
    tasksByCategory.get(task.categoryId)?.push(task);
  });

  return tasksByCategory;
}

export function getBoardMetrics(tasks: Task[]) {
  return tasks.reduce(
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
      totalTaskCount: tasks.length,
      dueSoonCount: 0,
      overdueCount: 0,
    },
  );
}

export function getBoardNotifications(tasks: Task[], categoryNameMap: Record<string, string>) {
  const notifications: BoardNotification[] = [];

  for (const task of tasks) {
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

export function getTaskDeleteCountdown(task: Task) {
  if (!task.deleteAfterAt) {
    return null;
  }

  const msLeft = new Date(task.deleteAfterAt).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
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

  if (item.action === "archived") {
    return "Archived the task";
  }

  if (item.action === "trashed") {
    return "Moved the task to trash";
  }

  if (item.action === "restored") {
    return "Restored the task";
  }

  if (item.action === "swapped") {
    return item.note ?? "Swapped task positions";
  }

  if (item.action === "deleted") {
    return "Deleted the task";
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

  if (item.action === "archived") {
    return "Task archived";
  }

  if (item.action === "trashed") {
    return "Task moved to trash";
  }

  if (item.action === "restored") {
    return "Task restored";
  }

  if (item.action === "swapped") {
    return item.note ?? "Task swapped";
  }

  if (item.action === "deleted") {
    return "Task deleted";
  }

  return item.note ?? "Task created";
}
