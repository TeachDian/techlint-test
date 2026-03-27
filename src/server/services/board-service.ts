import type {
  Board,
  Category,
  CreateCategoryPayload,
  CreateTaskPayload,
  MoveTaskPayload,
  Task,
  TaskHistory,
  UpdateTaskPayload,
} from "../../shared/api.js";
import type { DatabaseSync } from "node:sqlite";
import { runInTransaction } from "../db/database.js";
import { HttpError } from "../lib/http.js";
import { createId, nowIso } from "../lib/security.js";

type CategoryRow = {
  id: string;
  name: string;
  position: number;
  task_count: number;
};

type TaskRow = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string;
  expiry_at: string | null;
  position: number;
  draft_saved_at: string | null;
  created_at: string;
  updated_at: string;
};

type HistoryRow = {
  id: string;
  task_id: string;
  action: "created" | "moved" | "updated" | "reordered";
  from_category_id: string | null;
  to_category_id: string | null;
  note: string | null;
  created_at: string;
};

export type BoardService = ReturnType<typeof createBoardService>;

export function createBoardService(database: DatabaseSync) {
  const getCategoryRow = database.prepare(`
    SELECT id, name, position
    FROM categories
    WHERE id = :categoryId AND user_id = :userId
  `);

  const getTaskRow = database.prepare(`
    SELECT id, user_id, category_id, title, description, expiry_at, position, draft_saved_at, created_at, updated_at
    FROM tasks
    WHERE id = :taskId AND user_id = :userId
  `);

  const getCategoryNameRow = database.prepare(`
    SELECT id
    FROM categories
    WHERE user_id = :userId AND lower(name) = lower(:name)
  `);

  const getCategoryPosition = database.prepare(`
    SELECT COALESCE(MAX(position), -1) AS max_position
    FROM categories
    WHERE user_id = :userId
  `);

  const getTaskPosition = database.prepare(`
    SELECT COALESCE(MAX(position), -1) AS max_position
    FROM tasks
    WHERE user_id = :userId AND category_id = :categoryId
  `);

  const insertCategory = database.prepare(`
    INSERT INTO categories (id, user_id, name, position, created_at, updated_at)
    VALUES (:id, :userId, :name, :position, :createdAt, :updatedAt)
  `);

  const insertTask = database.prepare(`
    INSERT INTO tasks (id, user_id, category_id, title, description, expiry_at, position, draft_saved_at, created_at, updated_at)
    VALUES (:id, :userId, :categoryId, :title, :description, :expiryAt, :position, :draftSavedAt, :createdAt, :updatedAt)
  `);

  const updateTask = database.prepare(`
    UPDATE tasks
    SET title = :title,
        description = :description,
        expiry_at = :expiryAt,
        draft_saved_at = :draftSavedAt,
        updated_at = :updatedAt
    WHERE id = :taskId AND user_id = :userId
  `);

  const updateTaskPosition = database.prepare(`
    UPDATE tasks
    SET category_id = :categoryId,
        position = :position,
        updated_at = :updatedAt
    WHERE id = :taskId AND user_id = :userId
  `);

  const insertHistory = database.prepare(`
    INSERT INTO task_history (id, task_id, user_id, action, from_category_id, to_category_id, note, created_at)
    VALUES (:id, :taskId, :userId, :action, :fromCategoryId, :toCategoryId, :note, :createdAt)
  `);

  const getCategories = database.prepare(`
    SELECT categories.id, categories.name, categories.position, COUNT(tasks.id) AS task_count
    FROM categories
    LEFT JOIN tasks ON tasks.category_id = categories.id
    WHERE categories.user_id = :userId
    GROUP BY categories.id
    ORDER BY categories.position ASC
  `);

  const getTasks = database.prepare(`
    SELECT id, user_id, category_id, title, description, expiry_at, position, draft_saved_at, created_at, updated_at
    FROM tasks
    WHERE user_id = :userId
    ORDER BY category_id ASC, position ASC
  `);

  const getTaskHistory = database.prepare(`
    SELECT id, task_id, action, from_category_id, to_category_id, note, created_at
    FROM task_history
    WHERE user_id = :userId
    ORDER BY created_at DESC
    LIMIT 40
  `);

  const getTasksByCategory = database.prepare(`
    SELECT id, user_id, category_id, title, description, expiry_at, position, draft_saved_at, created_at, updated_at
    FROM tasks
    WHERE user_id = :userId AND category_id = :categoryId
    ORDER BY position ASC
  `);

  function toCategory(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      position: row.position,
      taskCount: Number(row.task_count),
    };
  }

  function toTask(row: TaskRow): Task {
    return {
      id: row.id,
      categoryId: row.category_id,
      title: row.title,
      description: row.description,
      expiryAt: row.expiry_at,
      position: row.position,
      draftSavedAt: row.draft_saved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function toTaskHistory(row: HistoryRow): TaskHistory {
    return {
      id: row.id,
      taskId: row.task_id,
      action: row.action,
      fromCategoryId: row.from_category_id,
      toCategoryId: row.to_category_id,
      note: row.note,
      createdAt: row.created_at,
    };
  }

  function normalizeExpiryAt(expiryAt?: string | null) {
    if (expiryAt === undefined) {
      return undefined;
    }

    if (expiryAt === null || expiryAt === "") {
      return null;
    }

    const parsedDate = new Date(expiryAt);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new HttpError(400, "Please choose a valid expiry date.", {
        expiryAt: "Please choose a valid expiry date.",
      });
    }

    return parsedDate.toISOString();
  }

  function getBoard(userId: string): Board {
    const categories = getCategories.all({ userId }) as CategoryRow[];
    const tasks = getTasks.all({ userId }) as TaskRow[];
    const history = getTaskHistory.all({ userId }) as HistoryRow[];

    return {
      categories: categories.map(toCategory),
      tasks: tasks.map(toTask),
      history: history.map(toTaskHistory),
    };
  }

  function requireCategory(userId: string, categoryId: string) {
    const category = getCategoryRow.get({ userId, categoryId }) as ({ id: string; name: string; position: number } | undefined);

    if (!category) {
      throw new HttpError(404, "The category was not found.");
    }

    return category;
  }

  function requireTask(userId: string, taskId: string) {
    const task = getTaskRow.get({ userId, taskId }) as TaskRow | undefined;

    if (!task) {
      throw new HttpError(404, "The task was not found.");
    }

    return task;
  }

  function addHistory(
    userId: string,
    taskId: string,
    action: HistoryRow["action"],
    fromCategoryId: string | null,
    toCategoryId: string | null,
    note: string | null,
  ) {
    insertHistory.run({
      id: createId(),
      taskId,
      userId,
      action,
      fromCategoryId,
      toCategoryId,
      note,
      createdAt: nowIso(),
    });
  }

  function createCategory(userId: string, payload: CreateCategoryPayload) {
    const name = payload.name.trim();
    const duplicateCategory = getCategoryNameRow.get({ userId, name }) as ({ id: string } | undefined);

    if (duplicateCategory) {
      throw new HttpError(409, "That category name already exists.", {
        name: "Pick a different category name.",
      });
    }

    const maxPositionRow = getCategoryPosition.get({ userId }) as { max_position: number };
    const timestamp = nowIso();

    insertCategory.run({
      id: createId(),
      userId,
      name,
      position: Number(maxPositionRow.max_position) + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return getBoard(userId);
  }

  function createTask(userId: string, payload: CreateTaskPayload) {
    requireCategory(userId, payload.categoryId);

    const maxPositionRow = getTaskPosition.get({
      userId,
      categoryId: payload.categoryId,
    }) as { max_position: number };

    const timestamp = nowIso();
    const expiryAt = normalizeExpiryAt(payload.expiryAt);
    const taskId = createId();

    insertTask.run({
      id: taskId,
      userId,
      categoryId: payload.categoryId,
      title: payload.title.trim(),
      description: payload.description ?? "",
      expiryAt: expiryAt ?? null,
      position: Number(maxPositionRow.max_position) + 1,
      draftSavedAt: payload.description ? timestamp : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    addHistory(userId, taskId, "created", null, payload.categoryId, "Task created");
    return getBoard(userId);
  }

  function updateTaskDetails(userId: string, taskId: string, payload: UpdateTaskPayload) {
    const currentTask = requireTask(userId, taskId);
    const nextTitle = payload.title === undefined ? currentTask.title : payload.title.trim();

    if (!nextTitle) {
      throw new HttpError(400, "Title is required.", {
        title: "Title is required.",
      });
    }

    const nextExpiryAt = normalizeExpiryAt(payload.expiryAt);
    const updatedAt = nowIso();
    const finalExpiryAt = nextExpiryAt === undefined ? currentTask.expiry_at : nextExpiryAt;
    const descriptionChanged = payload.description !== undefined && payload.description !== currentTask.description;
    const titleChanged = nextTitle !== currentTask.title;
    const expiryChanged = nextExpiryAt !== undefined && nextExpiryAt !== currentTask.expiry_at;

    updateTask.run({
      taskId,
      userId,
      title: nextTitle,
      description: payload.description ?? currentTask.description,
      expiryAt: finalExpiryAt,
      draftSavedAt: descriptionChanged ? updatedAt : currentTask.draft_saved_at,
      updatedAt,
    });

    if (titleChanged || expiryChanged) {
      addHistory(userId, taskId, "updated", currentTask.category_id, currentTask.category_id, "Task details updated");
    }

    return getBoard(userId);
  }

  function moveTaskToCategory(userId: string, taskId: string, payload: MoveTaskPayload) {
    const currentTask = requireTask(userId, taskId);
    requireCategory(userId, payload.categoryId);

    const sameCategory = currentTask.category_id === payload.categoryId;

    runInTransaction(database, () => {
      const updatedAt = nowIso();

      if (sameCategory) {
        const taskRows = getTasksByCategory.all({
          userId,
          categoryId: currentTask.category_id,
        }) as TaskRow[];

        const remainingTasks = taskRows.filter((task) => task.id !== taskId);
        const targetIndex = Math.max(0, Math.min(payload.position, remainingTasks.length));

        // Rebuild the list so the order stays correct after drag and drop.
        remainingTasks.splice(targetIndex, 0, currentTask);

        remainingTasks.forEach((task, index) => {
          updateTaskPosition.run({
            taskId: task.id,
            userId,
            categoryId: currentTask.category_id,
            position: index,
            updatedAt: task.id === taskId ? updatedAt : task.updated_at,
          });
        });

        if (targetIndex !== currentTask.position) {
          addHistory(userId, taskId, "reordered", currentTask.category_id, currentTask.category_id, "Task order updated");
        }

        return;
      }

      const sourceTasks = (getTasksByCategory.all({
        userId,
        categoryId: currentTask.category_id,
      }) as TaskRow[]).filter((task) => task.id !== taskId);

      const targetTasks = getTasksByCategory.all({
        userId,
        categoryId: payload.categoryId,
      }) as TaskRow[];

      const targetIndex = Math.max(0, Math.min(payload.position, targetTasks.length));
      const movedTask: TaskRow = {
        ...currentTask,
        category_id: payload.categoryId,
        updated_at: updatedAt,
      };

      targetTasks.splice(targetIndex, 0, movedTask);

      sourceTasks.forEach((task, index) => {
        updateTaskPosition.run({
          taskId: task.id,
          userId,
          categoryId: currentTask.category_id,
          position: index,
          updatedAt: task.updated_at,
        });
      });

      targetTasks.forEach((task, index) => {
        updateTaskPosition.run({
          taskId: task.id,
          userId,
          categoryId: payload.categoryId,
          position: index,
          updatedAt: task.id === taskId ? updatedAt : task.updated_at,
        });
      });

      addHistory(userId, taskId, "moved", currentTask.category_id, payload.categoryId, "Task moved between categories");
    });

    return getBoard(userId);
  }

  return {
    getBoard,
    createCategory,
    createTask,
    updateTask: updateTaskDetails,
    moveTask: moveTaskToCategory,
  };
}
