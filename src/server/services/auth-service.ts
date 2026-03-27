import type { LoginPayload, Priority, RegisterPayload, User } from "../../shared/api.js";
import type { DatabaseSync } from "node:sqlite";
import { runInTransaction } from "../db/database.js";
import { HttpError } from "../lib/http.js";
import {
  createId,
  createSessionToken,
  hashPassword,
  hashSessionToken,
  nowIso,
  SESSION_DURATION_MS,
  verifyPassword,
} from "../lib/security.js";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
};

type StarterBadge = {
  key: string;
  title: string;
  description: string;
  color: string;
};

type StarterTask = {
  categoryName: string;
  title: string;
  description: string;
  priority: Priority;
  badgeKeys: string[];
  expiryOffsetDays: number | null;
  comment?: string;
};

const DEFAULT_CATEGORIES = ["To Do", "In Progress", "Done"];

const DEFAULT_BADGES: StarterBadge[] = [
  {
    key: "client-review",
    title: "Client Review",
    description: "Use this when the task needs a client sign-off before closing.",
    color: "#1d4ed8",
  },
  {
    key: "ux",
    title: "UX",
    description: "Use this for interaction, layout, and usability work.",
    color: "#7c3aed",
  },
  {
    key: "backend",
    title: "Backend",
    description: "Use this for server, database, or API changes.",
    color: "#0f766e",
  },
  {
    key: "blocked",
    title: "Blocked",
    description: "Use this when the task is waiting on another person or dependency.",
    color: "#b45309",
  },
];

const STARTER_TASKS: StarterTask[] = [
  {
    categoryName: "To Do",
    title: "Review homepage copy",
    description: "Check the final page copy and confirm the wording is ready for the next release.",
    priority: "high",
    badgeKeys: ["client-review"],
    expiryOffsetDays: 4,
  },
  {
    categoryName: "In Progress",
    title: "Refine board drag feedback",
    description: "Make the drop states easier to follow and keep the first insert zone visible.",
    priority: "urgent",
    badgeKeys: ["ux"],
    expiryOffsetDays: 2,
    comment: "Keep the top drop area easy to hit when the column already has tasks.",
  },
  {
    categoryName: "Done",
    title: "Set up SQLite session storage",
    description: "Secure sessions and private board data are already connected to the local database.",
    priority: "medium",
    badgeKeys: ["backend"],
    expiryOffsetDays: null,
  },
];

function offsetIso(base: number, days: number) {
  return new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
}

export type AuthService = ReturnType<typeof createAuthService>;

export function createAuthService(database: DatabaseSync) {
  const findUserByEmail = database.prepare(`
    SELECT id, name, email, password_hash, created_at
    FROM users
    WHERE email = :email
  `);

  const findUserById = database.prepare(`
    SELECT id, name, email, password_hash, created_at
    FROM users
    WHERE id = :userId
  `);

  const insertUser = database.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (:id, :name, :email, :passwordHash, :createdAt)
  `);

  const insertCategory = database.prepare(`
    INSERT INTO categories (id, user_id, name, position, created_at, updated_at)
    VALUES (:id, :userId, :name, :position, :createdAt, :updatedAt)
  `);

  const insertBadgeDefinition = database.prepare(`
    INSERT INTO badge_definitions (id, user_id, title, description, color, created_at, updated_at)
    VALUES (:id, :userId, :title, :description, :color, :createdAt, :updatedAt)
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

  const insertTaskHistory = database.prepare(`
    INSERT INTO task_history (id, task_id, user_id, action, from_category_id, to_category_id, note, created_at)
    VALUES (:id, :taskId, :userId, :action, :fromCategoryId, :toCategoryId, :note, :createdAt)
  `);

  const insertTaskComment = database.prepare(`
    INSERT INTO task_comments (id, task_id, user_id, body, created_at, updated_at)
    VALUES (:id, :taskId, :userId, :body, :createdAt, :updatedAt)
  `);

  const insertTaskBadge = database.prepare(`
    INSERT INTO task_badges (task_id, badge_id, user_id, created_at)
    VALUES (:taskId, :badgeId, :userId, :createdAt)
  `);

  const insertSession = database.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at)
    VALUES (:id, :userId, :tokenHash, :expiresAt, :createdAt)
  `);

  const findSessionUser = database.prepare(`
    SELECT users.id, users.name, users.email, users.created_at, sessions.expires_at
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = :tokenHash
  `);

  const deleteSession = database.prepare(`
    DELETE FROM sessions
    WHERE token_hash = :tokenHash
  `);

  const deleteExpiredSessions = database.prepare(`
    DELETE FROM sessions
    WHERE expires_at <= :now
  `);

  function clearExpiredSessions() {
    deleteExpiredSessions.run({ now: nowIso() });
  }

  function toUser(row: Pick<UserRow, "id" | "name" | "email" | "created_at">): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.created_at,
    };
  }

  function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  function createSession(userId: string) {
    clearExpiredSessions();

    const sessionToken = createSessionToken();
    const createdAt = nowIso();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

    insertSession.run({
      id: createId(),
      userId,
      tokenHash: hashSessionToken(sessionToken),
      expiresAt,
      createdAt,
    });

    return sessionToken;
  }

  function getUserSessionRow(sessionToken: string) {
    clearExpiredSessions();

    return findSessionUser.get({
      tokenHash: hashSessionToken(sessionToken),
    }) as { id: string; name: string; email: string; created_at: string; expires_at: string } | undefined;
  }

  function seedStarterBoard(userId: string, createdAt: string) {
    const categoryIdMap = new Map<string, string>();
    const badgeIdMap = new Map<string, string>();
    const now = Date.now();

    DEFAULT_CATEGORIES.forEach((name, position) => {
      const categoryId = createId();
      categoryIdMap.set(name, categoryId);
      insertCategory.run({
        id: categoryId,
        userId,
        name,
        position,
        createdAt,
        updatedAt: createdAt,
      });
    });

    DEFAULT_BADGES.forEach((badge) => {
      const badgeId = createId();
      badgeIdMap.set(badge.key, badgeId);
      insertBadgeDefinition.run({
        id: badgeId,
        userId,
        title: badge.title,
        description: badge.description,
        color: badge.color,
        createdAt,
        updatedAt: createdAt,
      });
    });

    STARTER_TASKS.forEach((task, position) => {
      const taskId = createId();
      const taskCreatedAt = new Date(now + position * 60 * 1000).toISOString();
      const categoryId = categoryIdMap.get(task.categoryName);

      if (!categoryId) {
        throw new HttpError(500, `Missing starter category: ${task.categoryName}`);
      }

      insertTask.run({
        id: taskId,
        userId,
        categoryId,
        title: task.title,
        description: task.description,
        expiryAt: task.expiryOffsetDays === null ? null : offsetIso(now, task.expiryOffsetDays),
        position,
        draftSavedAt: taskCreatedAt,
        createdAt: taskCreatedAt,
        updatedAt: taskCreatedAt,
        priority: task.priority,
      });

      insertTaskHistory.run({
        id: createId(),
        taskId,
        userId,
        action: "created",
        fromCategoryId: null,
        toCategoryId: categoryId,
        note: "Starter task created",
        createdAt: taskCreatedAt,
      });

      task.badgeKeys.forEach((badgeKey) => {
        const badgeId = badgeIdMap.get(badgeKey);

        if (!badgeId) {
          throw new HttpError(500, `Missing starter badge: ${badgeKey}`);
        }

        insertTaskBadge.run({
          taskId,
          badgeId,
          userId,
          createdAt: taskCreatedAt,
        });
      });

      if (task.comment) {
        const commentCreatedAt = new Date(new Date(taskCreatedAt).getTime() + 60 * 1000).toISOString();
        insertTaskComment.run({
          id: createId(),
          taskId,
          userId,
          body: task.comment,
          createdAt: commentCreatedAt,
          updatedAt: commentCreatedAt,
        });

        insertTaskHistory.run({
          id: createId(),
          taskId,
          userId,
          action: "commented",
          fromCategoryId: categoryId,
          toCategoryId: categoryId,
          note: "Starter comment added",
          createdAt: commentCreatedAt,
        });
      }
    });
  }

  function registerUser(payload: RegisterPayload) {
    const email = normalizeEmail(payload.email);
    const existingUser = findUserByEmail.get({ email }) as UserRow | undefined;

    if (existingUser) {
      throw new HttpError(409, "That email is already in use.", {
        email: "Email is already in use.",
      });
    }

    const createdAt = nowIso();
    const userId = createId();

    runInTransaction(database, () => {
      insertUser.run({
        id: userId,
        name: payload.name.trim(),
        email,
        passwordHash: hashPassword(payload.password),
        createdAt,
      });

      seedStarterBoard(userId, createdAt);
    });

    const userRow = findUserById.get({ userId }) as UserRow | undefined;

    if (!userRow) {
      throw new HttpError(500, "Unable to create the user account.");
    }

    return {
      user: toUser(userRow),
      sessionToken: createSession(userId),
    };
  }

  function loginUser(payload: LoginPayload) {
    const email = normalizeEmail(payload.email);
    const userRow = findUserByEmail.get({ email }) as UserRow | undefined;

    if (!userRow || !verifyPassword(payload.password, userRow.password_hash)) {
      throw new HttpError(401, "Email or password is not correct.", {
        email: "Check your email and password.",
      });
    }

    return {
      user: toUser(userRow),
      sessionToken: createSession(userRow.id),
    };
  }

  function getSessionUser(sessionToken: string) {
    const sessionRow = getUserSessionRow(sessionToken);

    if (!sessionRow) {
      return null;
    }

    if (new Date(sessionRow.expires_at).getTime() <= Date.now()) {
      deleteSession.run({ tokenHash: hashSessionToken(sessionToken) });
      return null;
    }

    return toUser(sessionRow);
  }

  function clearSession(sessionToken: string | null) {
    if (!sessionToken) {
      return;
    }

    deleteSession.run({ tokenHash: hashSessionToken(sessionToken) });
  }

  return {
    registerUser,
    loginUser,
    getSessionUser,
    clearSession,
  };
}
