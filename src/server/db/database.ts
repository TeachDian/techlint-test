import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

export function resolveDatabasePath(overridePath?: string) {
  if (!overridePath) {
    return path.resolve(process.cwd(), process.env.DATABASE_PATH ?? "todo-board.sqlite");
  }

  if (overridePath === ":memory:") {
    return overridePath;
  }

  return path.isAbsolute(overridePath) ? overridePath : path.resolve(process.cwd(), overridePath);
}

export function createDatabase(overridePath?: string) {
  const databasePath = resolveDatabasePath(overridePath);

  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const database = new DatabaseSync(databasePath);

  database.exec("PRAGMA foreign_keys = ON;");

  if (databasePath !== ":memory:") {
    database.exec("PRAGMA journal_mode = WAL;");
  }

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      expiry_at TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      draft_saved_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_history (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      from_category_id TEXT,
      to_category_id TEXT,
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_categories_user_position ON categories(user_id, position);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_category_position ON tasks(user_id, category_id, position);
    CREATE INDEX IF NOT EXISTS idx_task_history_user_created_at ON task_history(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_task_comments_user_created_at ON task_comments(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_task_comments_task_created_at ON task_comments(task_id, created_at DESC);
  `);

  return database;
}

export function runInTransaction<T>(database: DatabaseSync, action: () => T) {
  database.exec("BEGIN IMMEDIATE");

  try {
    const result = action();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function deleteDatabaseFile(overridePath?: string) {
  const databasePath = resolveDatabasePath(overridePath);

  if (databasePath === ":memory:") {
    return;
  }

  for (const candidatePath of [databasePath, `${databasePath}-shm`, `${databasePath}-wal`]) {
    if (fs.existsSync(candidatePath)) {
      fs.rmSync(candidatePath, { force: true });
    }
  }
}
