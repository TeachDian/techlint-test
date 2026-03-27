import type { LoginPayload, RegisterPayload, User } from "../../shared/api.js";
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

const DEFAULT_CATEGORIES = ["To Do", "In Progress", "Done"];

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
    }) as ({ id: string; name: string; email: string; created_at: string; expires_at: string } | undefined);
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

      DEFAULT_CATEGORIES.forEach((name, position) => {
        insertCategory.run({
          id: createId(),
          userId,
          name,
          position,
          createdAt,
          updatedAt: createdAt,
        });
      });
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
