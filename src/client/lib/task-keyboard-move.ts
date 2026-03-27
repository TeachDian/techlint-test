import type { Category, MoveTaskPayload, Task } from "@shared/api";

export type KeyboardMoveDirection = "up" | "down" | "left" | "right";

export function getKeyboardMovePayload(
  taskId: string,
  direction: KeyboardMoveDirection,
  categories: Category[],
  tasksByCategory: Map<string, Task[]>,
): MoveTaskPayload | null {
  let currentTask: Task | null = null;

  for (const tasks of tasksByCategory.values()) {
    const task = tasks.find((candidate) => candidate.id === taskId);

    if (task) {
      currentTask = task;
      break;
    }
  }

  if (!currentTask) {
    return null;
  }

  const currentTasks = tasksByCategory.get(currentTask.categoryId) ?? [];
  const currentIndex = currentTasks.findIndex((task) => task.id === currentTask?.id);
  const categoryIndex = categories.findIndex((category) => category.id === currentTask.categoryId);

  if (currentIndex < 0 || categoryIndex < 0) {
    return null;
  }

  if (direction === "up") {
    if (currentIndex === 0) {
      return null;
    }

    return {
      categoryId: currentTask.categoryId,
      position: currentIndex - 1,
    };
  }

  if (direction === "down") {
    if (currentIndex >= currentTasks.length - 1) {
      return null;
    }

    return {
      categoryId: currentTask.categoryId,
      position: currentIndex + 1,
    };
  }

  const nextCategory = direction === "left" ? categories[categoryIndex - 1] : categories[categoryIndex + 1];

  if (!nextCategory) {
    return null;
  }

  const nextTasks = tasksByCategory.get(nextCategory.id) ?? [];

  return {
    categoryId: nextCategory.id,
    position: nextTasks.length,
  };
}
