// @vitest-environment node

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDatabase, deleteDatabaseFile } from "../../server/db/database.js";
import { createAuthService } from "../../server/services/auth-service.js";
import { createBoardService } from "../../server/services/board-service.js";
import { createTaskReminderService } from "../../server/services/task-reminder-service.js";

describe("task reminder service", () => {
  let databasePath = "";
  let logPath = "";
  let database: ReturnType<typeof createDatabase>;

  beforeEach(() => {
    databasePath = path.resolve(process.cwd(), `todo-board.reminders.${randomUUID()}.sqlite`);
    logPath = path.resolve(process.cwd(), `task-reminders.${randomUUID()}.log`);
    database = createDatabase(databasePath);
  });

  afterEach(() => {
    database.close();
    deleteDatabaseFile(databasePath);

    if (fs.existsSync(logPath)) {
      fs.rmSync(logPath, { force: true });
    }
  });

  it("sends due-soon and overdue reminders once per task and status", () => {
    const authService = createAuthService(database);
    const boardService = createBoardService(database);
    const reminderService = createTaskReminderService(database, {
      lookaheadHours: 12,
      outputPath: logPath,
      transport: "file",
    });

    const registration = authService.registerUser({
      name: "Reminder User",
      email: "reminder@example.com",
      password: "password123",
    });

    const board = boardService.getBoard(registration.user.id);
    const todoCategoryId = board.categories[0].id;
    const now = Date.now();

    boardService.createTask(registration.user.id, {
      categoryId: todoCategoryId,
      title: "Due soon task",
      description: "Needs a reminder soon",
      expiryAt: new Date(now + 6 * 60 * 60 * 1000).toISOString(),
      priority: "high",
    });

    boardService.createTask(registration.user.id, {
      categoryId: todoCategoryId,
      title: "Overdue task",
      description: "Needs an overdue reminder",
      expiryAt: new Date(now - 60 * 60 * 1000).toISOString(),
      priority: "urgent",
    });

    const firstRun = reminderService.runSweep(now);
    const secondRun = reminderService.runSweep(now);

    expect(firstRun.remindersSent).toBe(2);
    expect(firstRun.dueSoonCount).toBe(1);
    expect(firstRun.overdueCount).toBe(1);
    expect(secondRun.remindersSent).toBe(0);

    const logLines = fs.readFileSync(logPath, "utf8").trim().split(/\r?\n/);
    expect(logLines).toHaveLength(2);
    expect(logLines.some((line) => line.includes("Due soon task"))).toBe(true);
    expect(logLines.some((line) => line.includes("Overdue task"))).toBe(true);
  });
});
