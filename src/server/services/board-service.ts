import type {
  BadgeDefinition,
  Board,
  BoardFilterPreset,
  Category,
  CreateBadgeDefinitionPayload,
  CreateBoardFilterPresetPayload,
  CreateCategoryPayload,
  CreateTaskCommentPayload,
  CreateTaskPayload,
  MoveTaskPayload,
  Priority,
  Task,
  TaskBadge,
  TaskComment,
  TaskHistory,
  UpdateBadgeDefinitionPayload,
  UpdateBoardFilterPresetPayload,
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
  priority: Priority | null;
  archived_at: string | null;
  trashed_at: string | null;
  delete_after_at: string | null;
};

type HistoryRow = {
  id: string;
  task_id: string;
  action: TaskHistory["action"];
  from_category_id: string | null;
  to_category_id: string | null;
  note: string | null;
  created_at: string;
};

type CommentRow = {
  id: string;
  task_id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type BadgeDefinitionRow = {
  id: string;
  title: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
};

type TaskBadgeRow = {
  task_id: string;
  badge_id: string;
};

type FilterPresetRow = {
  id: string;
  name: string;
  query: string;
  start_date: string;
  end_date: string;
  priority: Priority | null;
  badge_id: string | null;
  created_at: string;
  updated_at: string;
};

const PRIORITY_VALUES: Priority[] = ["low", "medium", "high", "urgent"];
const TRASH_RETENTION_DAYS = 30;

export type BoardService = ReturnType<typeof createBoardService>;

function makeDeleteAfterAt(now: string) {
  return new Date(new Date(now).getTime() + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function createBoardService(database: DatabaseSync) {
  const getCategoryRow = database.prepare(`
    SELECT id, name, position
    FROM categories
    WHERE id = :categoryId AND user_id = :userId
  `);

  const getTaskRow = database.prepare(`
    SELECT id, user_id, category_id, title, description, expiry_at, position, draft_saved_at, created_at, updated_at, priority, archived_at, trashed_at, delete_after_at
    FROM tasks
    WHERE id = :taskId AND user_id = :userId
  `);

  const getBadgeDefinitionRow = database.prepare(`
    SELECT id, title, description, color, created_at, updated_at
    FROM badge_definitions
    WHERE id = :badgeId AND user_id = :userId
  `);

  const getFilterPresetRow = database.prepare(`
    SELECT id, name, query, start_date, end_date, priority, badge_id, created_at, updated_at
    FROM filter_presets
    WHERE id = :presetId AND user_id = :userId
  `);

  const getCategoryNameRow = database.prepare(`
    SELECT id
    FROM categories
    WHERE user_id = :userId AND lower(name) = lower(:name)
  `);

  const getBadgeTitleRow = database.prepare(`
    SELECT id
    FROM badge_definitions
    WHERE user_id = :userId AND lower(title) = lower(:title)
  `);

  const getFilterPresetNameRow = database.prepare(`
    SELECT id
    FROM filter_presets
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
    WHERE user_id = :userId
      AND category_id = :categoryId
      AND archived_at IS NULL
      AND trashed_at IS NULL
  `);

  const insertCategory = database.prepare(`
    INSERT INTO categories (id, user_id, name, position, created_at, updated_at)
    VALUES (:id, :userId, :name, :position, :createdAt, :updatedAt)
  `);

  const insertTask = database.prepare(`
    INSERT INTO tasks (
      id,
      user_id,
      category_id,
      title,
      description,
      expiry_at,
      position,
      draft_saved_at,
      created_at,
      updated_at,
      priority,
      archived_at,
      trashed_at,
      delete_after_at
    )
    VALUES (
      :id,
      :userId,
      :categoryId,
      :title,
      :description,
      :expiryAt,
      :position,
      :draftSavedAt,
      :createdAt,
      :updatedAt,
      :priority,
      NULL,
      NULL,
      NULL
    )
  `);

  const updateTask = database.prepare(`
    UPDATE tasks
    SET title = :title,
        description = :description,
        expiry_at = :expiryAt,
        draft_saved_at = :draftSavedAt,
        updated_at = :updatedAt,
        priority = :priority
    WHERE id = :taskId AND user_id = :userId
  `);

  const updateTaskTimestamp = database.prepare(`
    UPDATE tasks
    SET updated_at = :updatedAt
    WHERE id = :taskId AND user_id = :userId
  `);

  const updateTaskPosition = database.prepare(`
    UPDATE tasks
    SET category_id = :categoryId,
        position = :position,
        updated_at = :updatedAt
    WHERE id = :taskId AND user_id = :userId
  `);

  const updateTaskState = database.prepare(`
    UPDATE tasks
    SET position = :position,
        archived_at = :archivedAt,
        trashed_at = :trashedAt,
        delete_after_at = :deleteAfterAt,
        updated_at = :updatedAt
    WHERE id = :taskId AND user_id = :userId
  `);

  const deleteTaskRow = database.prepare(`
    DELETE FROM tasks
    WHERE id = :taskId AND user_id = :userId
  `);

  const insertHistory = database.prepare(`
    INSERT INTO task_history (id, task_id, user_id, action, from_category_id, to_category_id, note, created_at)
    VALUES (:id, :taskId, :userId, :action, :fromCategoryId, :toCategoryId, :note, :createdAt)
  `);

  const insertComment = database.prepare(`
    INSERT INTO task_comments (id, task_id, user_id, body, created_at, updated_at)
    VALUES (:id, :taskId, :userId, :body, :createdAt, :updatedAt)
  `);

  const insertBadgeDefinition = database.prepare(`
    INSERT INTO badge_definitions (id, user_id, title, description, color, created_at, updated_at)
    VALUES (:id, :userId, :title, :description, :color, :createdAt, :updatedAt)
  `);

  const updateBadgeDefinition = database.prepare(`
    UPDATE badge_definitions
    SET title = :title,
        description = :description,
        color = :color,
        updated_at = :updatedAt
    WHERE id = :badgeId AND user_id = :userId
  `);

  const deleteBadgeDefinition = database.prepare(`
    DELETE FROM badge_definitions
    WHERE id = :badgeId AND user_id = :userId
  `);

  const insertFilterPreset = database.prepare(`
    INSERT INTO filter_presets (id, user_id, name, query, start_date, end_date, priority, badge_id, created_at, updated_at)
    VALUES (:id, :userId, :name, :query, :startDate, :endDate, :priority, :badgeId, :createdAt, :updatedAt)
  `);

  const updateFilterPreset = database.prepare(`
    UPDATE filter_presets
    SET name = :name,
        query = :query,
        start_date = :startDate,
        end_date = :endDate,
        priority = :priority,
        badge_id = :badgeId,
        updated_at = :updatedAt
    WHERE id = :presetId AND user_id = :userId
  `);

  const deleteFilterPreset = database.prepare(`
    DELETE FROM filter_presets
    WHERE id = :presetId AND user_id = :userId
  `);

  const deleteTaskBadgesForTask = database.prepare(`
    DELETE FROM task_badges
    WHERE task_id = :taskId AND user_id = :userId
  `);

  const insertTaskBadge = database.prepare(`
    INSERT INTO task_badges (task_id, badge_id, user_id, created_at)
    VALUES (:taskId, :badgeId, :userId, :createdAt)
  `);

  const deleteExpiredTrashedTasks = database.prepare(`
    DELETE FROM tasks
    WHERE user_id = :userId
      AND delete_after_at IS NOT NULL
      AND delete_after_at <= :now
  `);

  const getCategories = database.prepare(`
    SELECT categories.id, categories.name, categories.position, COUNT(tasks.id) AS task_count
    FROM categories
    LEFT JOIN tasks ON tasks.category_id = categories.id
      AND tasks.user_id = categories.user_id
      AND tasks.archived_at IS NULL
      AND tasks.trashed_at IS NULL
    WHERE categories.user_id = :userId
    GROUP BY categories.id
    ORDER BY categories.position ASC
  `);

  const getTasks = database.prepare(`
    SELECT id, user_id, category_id, title, description, expiry_at, position, draft_saved_at, created_at, updated_at, priority, archived_at, trashed_at, delete_after_at
    FROM tasks
    WHERE user_id = :userId
    ORDER BY category_id ASC, position ASC, created_at ASC
  `);

  const getTaskHistory = database.prepare(`
    SELECT id, task_id, action, from_category_id, to_category_id, note, created_at
    FROM task_history
    WHERE user_id = :userId
    ORDER BY created_at DESC
    LIMIT 120
  `);

  const getTaskComments = database.prepare(`
    SELECT id, task_id, body, created_at, updated_at
    FROM task_comments
    WHERE user_id = :userId
    ORDER BY created_at DESC
    LIMIT 300
  `);
  const getBadgeDefinitions = database.prepare(`
    SELECT id, title, description, color, created_at, updated_at
    FROM badge_definitions
    WHERE user_id = :userId
    ORDER BY title ASC
  `);

  const getTaskBadges = database.prepare(`
    SELECT task_id, badge_id
    FROM task_badges
    WHERE user_id = :userId
    ORDER BY task_id ASC, badge_id ASC
  `);

  const getFilterPresets = database.prepare(`
    SELECT id, name, query, start_date, end_date, priority, badge_id, created_at, updated_at
    FROM filter_presets
    WHERE user_id = :userId
    ORDER BY name ASC, created_at ASC
  `);

  const getTaskBadgeIds = database.prepare(`
    SELECT badge_id
    FROM task_badges
    WHERE task_id = :taskId AND user_id = :userId
    ORDER BY badge_id ASC
  `);

  const getTasksByCategory = database.prepare(`
    SELECT id, user_id, category_id, title, description, expiry_at, position, draft_saved_at, created_at, updated_at, priority, archived_at, trashed_at, delete_after_at
    FROM tasks
    WHERE user_id = :userId
      AND category_id = :categoryId
      AND archived_at IS NULL
      AND trashed_at IS NULL
    ORDER BY position ASC, created_at ASC
  `);

  function clearExpiredTrash(userId: string) {
    deleteExpiredTrashedTasks.run({ userId, now: nowIso() });
  }

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
      priority: row.priority,
      draftSavedAt: row.draft_saved_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      archivedAt: row.archived_at,
      trashedAt: row.trashed_at,
      deleteAfterAt: row.delete_after_at,
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

  function toTaskComment(row: CommentRow): TaskComment {
    return {
      id: row.id,
      taskId: row.task_id,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function toBadgeDefinition(row: BadgeDefinitionRow): BadgeDefinition {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      color: row.color,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  function toTaskBadge(row: TaskBadgeRow): TaskBadge {
    return {
      taskId: row.task_id,
      badgeId: row.badge_id,
    };
  }

  function toFilterPreset(row: FilterPresetRow): BoardFilterPreset {
    return {
      id: row.id,
      name: row.name,
      query: row.query,
      startDate: row.start_date,
      endDate: row.end_date,
      priority: row.priority,
      badgeId: row.badge_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
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

  function normalizePriority(priority?: Priority | null) {
    if (priority === undefined) {
      return undefined;
    }

    if (priority === null) {
      return null;
    }

    if (!PRIORITY_VALUES.includes(priority)) {
      throw new HttpError(400, "Please choose a valid priority.", {
        priority: "Please choose a valid priority.",
      });
    }

    return priority;
  }

  function normalizeCommentBody(body: string) {
    const normalizedBody = body.trim();

    if (!normalizedBody) {
      throw new HttpError(400, "Comment text is required.", {
        body: "Comment text is required.",
      });
    }

    return normalizedBody;
  }

  function normalizeBadgeIds(userId: string, badgeIds?: string[]) {
    if (badgeIds === undefined) {
      return undefined;
    }

    const uniqueBadgeIds = [...new Set(badgeIds)];

    uniqueBadgeIds.forEach((badgeId) => {
      const badge = getBadgeDefinitionRow.get({ userId, badgeId }) as BadgeDefinitionRow | undefined;

      if (!badge) {
        throw new HttpError(400, "Please choose a valid badge.", {
          badgeIds: "Please choose a valid badge.",
        });
      }
    });

    return uniqueBadgeIds;
  }

  function normalizeBadgePayload(userId: string, payload: CreateBadgeDefinitionPayload | UpdateBadgeDefinitionPayload, currentBadgeId?: string) {
    const title = payload.title.trim();
    const description = (payload.description ?? "").trim();
    const color = payload.color.trim();
    const duplicateBadge = getBadgeTitleRow.get({ userId, title }) as { id: string } | undefined;

    if (duplicateBadge && duplicateBadge.id !== currentBadgeId) {
      throw new HttpError(409, "That badge title already exists.", {
        title: "Pick a different badge title.",
      });
    }

    return {
      title,
      description,
      color,
    };
  }

  function normalizeFilterPresetPayload(userId: string, payload: CreateBoardFilterPresetPayload | UpdateBoardFilterPresetPayload) {
    const name = payload.name.trim();
    const query = (payload.query ?? "").trim();
    const startDate = (payload.startDate ?? "").trim();
    const endDate = (payload.endDate ?? "").trim();
    const priority = normalizePriority(payload.priority) ?? null;
    const badgeId = payload.badgeId ? payload.badgeId : null;

    if (startDate && Number.isNaN(new Date(startDate).getTime())) {
      throw new HttpError(400, "Please choose a valid start date.", {
        startDate: "Please choose a valid start date.",
      });
    }

    if (endDate && Number.isNaN(new Date(endDate).getTime())) {
      throw new HttpError(400, "Please choose a valid end date.", {
        endDate: "Please choose a valid end date.",
      });
    }

    if (badgeId) {
      const badge = getBadgeDefinitionRow.get({ userId, badgeId }) as BadgeDefinitionRow | undefined;

      if (!badge) {
        throw new HttpError(400, "Please choose a valid badge.", {
          badgeId: "Please choose a valid badge.",
        });
      }
    }

    return {
      name,
      query,
      startDate,
      endDate,
      priority,
      badgeId,
    };
  }

  function getCurrentBadgeIds(userId: string, taskId: string) {
    return (getTaskBadgeIds.all({ userId, taskId }) as { badge_id: string }[]).map((row) => row.badge_id);
  }

  function replaceTaskBadges(userId: string, taskId: string, badgeIds: string[], createdAt: string) {
    deleteTaskBadgesForTask.run({ taskId, userId });

    badgeIds.forEach((badgeId) => {
      insertTaskBadge.run({
        taskId,
        badgeId,
        userId,
        createdAt,
      });
    });
  }

  function getBoard(userId: string): Board {
    clearExpiredTrash(userId);

    const categories = getCategories.all({ userId }) as CategoryRow[];
    const tasks = getTasks.all({ userId }) as TaskRow[];
    const history = getTaskHistory.all({ userId }) as HistoryRow[];
    const comments = getTaskComments.all({ userId }) as CommentRow[];
    const badgeDefinitions = getBadgeDefinitions.all({ userId }) as BadgeDefinitionRow[];
    const taskBadges = getTaskBadges.all({ userId }) as TaskBadgeRow[];
    const filterPresets = getFilterPresets.all({ userId }) as FilterPresetRow[];

    return {
      categories: categories.map(toCategory),
      tasks: tasks.map(toTask),
      history: history.map(toTaskHistory),
      comments: comments.map(toTaskComment),
      badgeDefinitions: badgeDefinitions.map(toBadgeDefinition),
      taskBadges: taskBadges.map(toTaskBadge),
      filterPresets: filterPresets.map(toFilterPreset),
    };
  }

  function requireCategory(userId: string, categoryId: string) {
    const category = getCategoryRow.get({ userId, categoryId }) as { id: string; name: string; position: number } | undefined;

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

  function requireActiveTask(userId: string, taskId: string) {
    const task = requireTask(userId, taskId);

    if (task.archived_at || task.trashed_at) {
      throw new HttpError(400, "The task is not active on the board.");
    }

    return task;
  }

  function requireFilterPreset(userId: string, presetId: string) {
    const preset = getFilterPresetRow.get({ userId, presetId }) as FilterPresetRow | undefined;

    if (!preset) {
      throw new HttpError(404, "The filter preset was not found.");
    }

    return preset;
  }

  function addHistory(
    userId: string,
    taskId: string,
    action: HistoryRow["action"],
    fromCategoryId: string | null,
    toCategoryId: string | null,
    note: string | null,
    createdAt = nowIso(),
  ) {
    insertHistory.run({
      id: createId(),
      taskId,
      userId,
      action,
      fromCategoryId,
      toCategoryId,
      note,
      createdAt,
    });
  }
  function createCategory(userId: string, payload: CreateCategoryPayload) {
    const name = payload.name.trim();
    const duplicateCategory = getCategoryNameRow.get({ userId, name }) as { id: string } | undefined;

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

  function createBadgeDefinitionForUser(userId: string, payload: CreateBadgeDefinitionPayload) {
    const { title, description, color } = normalizeBadgePayload(userId, payload);
    const timestamp = nowIso();

    insertBadgeDefinition.run({
      id: createId(),
      userId,
      title,
      description,
      color,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return getBoard(userId);
  }

  function updateBadgeDefinitionForUser(userId: string, badgeId: string, payload: UpdateBadgeDefinitionPayload) {
    const badge = getBadgeDefinitionRow.get({ userId, badgeId }) as BadgeDefinitionRow | undefined;

    if (!badge) {
      throw new HttpError(404, "The badge was not found.");
    }

    const { title, description, color } = normalizeBadgePayload(userId, payload, badgeId);

    updateBadgeDefinition.run({
      badgeId,
      userId,
      title,
      description,
      color,
      updatedAt: nowIso(),
    });

    return getBoard(userId);
  }

  function deleteBadgeDefinitionForUser(userId: string, badgeId: string) {
    const badge = getBadgeDefinitionRow.get({ userId, badgeId }) as BadgeDefinitionRow | undefined;

    if (!badge) {
      throw new HttpError(404, "The badge was not found.");
    }

    deleteBadgeDefinition.run({ badgeId, userId });
    return getBoard(userId);
  }

  function createFilterPresetForUser(userId: string, payload: CreateBoardFilterPresetPayload) {
    const normalized = normalizeFilterPresetPayload(userId, payload);
    const duplicatePreset = getFilterPresetNameRow.get({ userId, name: normalized.name }) as { id: string } | undefined;

    if (duplicatePreset) {
      throw new HttpError(409, "That preset name already exists.", {
        name: "Pick a different preset name.",
      });
    }

    const timestamp = nowIso();

    insertFilterPreset.run({
      id: createId(),
      userId,
      ...normalized,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return getBoard(userId);
  }

  function updateFilterPresetForUser(userId: string, presetId: string, payload: UpdateBoardFilterPresetPayload) {
    requireFilterPreset(userId, presetId);
    const normalized = normalizeFilterPresetPayload(userId, payload);
    const duplicatePreset = getFilterPresetNameRow.get({ userId, name: normalized.name }) as { id: string } | undefined;

    if (duplicatePreset && duplicatePreset.id !== presetId) {
      throw new HttpError(409, "That preset name already exists.", {
        name: "Pick a different preset name.",
      });
    }

    updateFilterPreset.run({
      presetId,
      userId,
      ...normalized,
      updatedAt: nowIso(),
    });

    return getBoard(userId);
  }

  function deleteFilterPresetForUser(userId: string, presetId: string) {
    requireFilterPreset(userId, presetId);
    deleteFilterPreset.run({ presetId, userId });
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
    const priority = normalizePriority(payload.priority) ?? null;
    const badgeIds = normalizeBadgeIds(userId, payload.badgeIds) ?? [];
    const taskId = createId();

    runInTransaction(database, () => {
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
        priority,
      });

      replaceTaskBadges(userId, taskId, badgeIds, timestamp);
      addHistory(userId, taskId, "created", null, payload.categoryId, "Task created", timestamp);
    });

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
    const nextPriority = normalizePriority(payload.priority);
    const nextBadgeIds = normalizeBadgeIds(userId, payload.badgeIds);
    const currentBadgeIds = getCurrentBadgeIds(userId, taskId);
    const updatedAt = nowIso();
    const finalExpiryAt = nextExpiryAt === undefined ? currentTask.expiry_at : nextExpiryAt;
    const finalPriority = nextPriority === undefined ? currentTask.priority : nextPriority;
    const description = payload.description ?? currentTask.description;
    const descriptionChanged = payload.description !== undefined && payload.description !== currentTask.description;
    const titleChanged = nextTitle !== currentTask.title;
    const expiryChanged = nextExpiryAt !== undefined && nextExpiryAt !== currentTask.expiry_at;
    const priorityChanged = nextPriority !== undefined && nextPriority !== currentTask.priority;
    const badgeIdsChanged = nextBadgeIds !== undefined && JSON.stringify(nextBadgeIds) !== JSON.stringify(currentBadgeIds);

    runInTransaction(database, () => {
      updateTask.run({
        taskId,
        userId,
        title: nextTitle,
        description,
        expiryAt: finalExpiryAt,
        draftSavedAt: descriptionChanged ? updatedAt : currentTask.draft_saved_at,
        updatedAt,
        priority: finalPriority,
      });

      if (nextBadgeIds !== undefined) {
        replaceTaskBadges(userId, taskId, nextBadgeIds, updatedAt);
      }

      if (titleChanged || expiryChanged || priorityChanged || badgeIdsChanged) {
        addHistory(userId, taskId, "updated", currentTask.category_id, currentTask.category_id, "Task details updated", updatedAt);
      }
    });

    return getBoard(userId);
  }
  function moveTaskToCategory(userId: string, taskId: string, payload: MoveTaskPayload) {
    const currentTask = requireActiveTask(userId, taskId);
    requireCategory(userId, payload.categoryId);

    runInTransaction(database, () => {
      const updatedAt = nowIso();

      if (payload.swapWithTaskId) {
        const targetTask = requireActiveTask(userId, payload.swapWithTaskId);

        if (targetTask.id === currentTask.id) {
          return;
        }

        updateTaskPosition.run({
          taskId: currentTask.id,
          userId,
          categoryId: targetTask.category_id,
          position: targetTask.position,
          updatedAt,
        });

        updateTaskPosition.run({
          taskId: targetTask.id,
          userId,
          categoryId: currentTask.category_id,
          position: currentTask.position,
          updatedAt,
        });

        addHistory(userId, currentTask.id, "swapped", currentTask.category_id, targetTask.category_id, `Swapped with ${targetTask.title}`, updatedAt);
        addHistory(userId, targetTask.id, "swapped", targetTask.category_id, currentTask.category_id, `Swapped with ${currentTask.title}`, updatedAt);
        return;
      }

      const sameCategory = currentTask.category_id === payload.categoryId;

      if (sameCategory) {
        const taskRows = getTasksByCategory.all({
          userId,
          categoryId: currentTask.category_id,
        }) as TaskRow[];

        const remainingTasks = taskRows.filter((task) => task.id !== taskId);
        const targetIndex = Math.max(0, Math.min(payload.position, remainingTasks.length));

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
          addHistory(userId, taskId, "reordered", currentTask.category_id, currentTask.category_id, "Task order updated", updatedAt);
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

      addHistory(userId, taskId, "moved", currentTask.category_id, payload.categoryId, "Task moved between categories", updatedAt);
    });

    return getBoard(userId);
  }

  function addTaskComment(userId: string, taskId: string, payload: CreateTaskCommentPayload) {
    const currentTask = requireTask(userId, taskId);
    const body = normalizeCommentBody(payload.body);
    const timestamp = nowIso();

    runInTransaction(database, () => {
      insertComment.run({
        id: createId(),
        taskId,
        userId,
        body,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      updateTaskTimestamp.run({
        taskId,
        userId,
        updatedAt: timestamp,
      });

      addHistory(userId, taskId, "commented", currentTask.category_id, currentTask.category_id, "Comment added", timestamp);
    });

    return getBoard(userId);
  }

  function archiveTask(userId: string, taskId: string) {
    const currentTask = requireActiveTask(userId, taskId);
    const updatedAt = nowIso();

    updateTaskState.run({
      taskId,
      userId,
      position: currentTask.position,
      archivedAt: updatedAt,
      trashedAt: null,
      deleteAfterAt: null,
      updatedAt,
    });

    addHistory(userId, taskId, "archived", currentTask.category_id, currentTask.category_id, "Task archived", updatedAt);
    return getBoard(userId);
  }

  function trashTask(userId: string, taskId: string) {
    const currentTask = requireTask(userId, taskId);
    const updatedAt = nowIso();

    updateTaskState.run({
      taskId,
      userId,
      position: currentTask.position,
      archivedAt: null,
      trashedAt: updatedAt,
      deleteAfterAt: makeDeleteAfterAt(updatedAt),
      updatedAt,
    });

    addHistory(userId, taskId, "trashed", currentTask.category_id, currentTask.category_id, "Task moved to trash", updatedAt);
    return getBoard(userId);
  }

  function restoreTask(userId: string, taskId: string) {
    const currentTask = requireTask(userId, taskId);
    const maxPositionRow = getTaskPosition.get({ userId, categoryId: currentTask.category_id }) as { max_position: number };
    const updatedAt = nowIso();

    updateTaskState.run({
      taskId,
      userId,
      position: Number(maxPositionRow.max_position) + 1,
      archivedAt: null,
      trashedAt: null,
      deleteAfterAt: null,
      updatedAt,
    });

    addHistory(userId, taskId, "restored", currentTask.category_id, currentTask.category_id, "Task restored", updatedAt);
    return getBoard(userId);
  }

  function deleteTaskPermanently(userId: string, taskId: string) {
    requireTask(userId, taskId);
    deleteTaskRow.run({ taskId, userId });
    return getBoard(userId);
  }

  return {
    getBoard,
    createCategory,
    createBadgeDefinition: createBadgeDefinitionForUser,
    updateBadgeDefinition: updateBadgeDefinitionForUser,
    deleteBadgeDefinition: deleteBadgeDefinitionForUser,
    createFilterPreset: createFilterPresetForUser,
    updateFilterPreset: updateFilterPresetForUser,
    deleteFilterPreset: deleteFilterPresetForUser,
    createTask,
    updateTask: updateTaskDetails,
    moveTask: moveTaskToCategory,
    addTaskComment,
    archiveTask,
    trashTask,
    restoreTask,
    deleteTask: deleteTaskPermanently,
  };
}
