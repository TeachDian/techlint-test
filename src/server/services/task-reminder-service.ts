import type { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { createId, nowIso } from "../lib/security.js";

type ReminderCandidateRow = {
  task_id: string;
  task_title: string;
  category_name: string;
  expiry_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
};

type ReminderType = "due-soon" | "overdue";
type ReminderTransport = "file" | "console" | "silent";

type ReminderEntry = {
  userId: string;
  userName: string;
  userEmail: string;
  taskId: string;
  taskTitle: string;
  categoryName: string;
  expiryAt: string;
  reminderType: ReminderType;
};

type ReminderServiceOptions = {
  channel?: string;
  lookaheadHours?: number;
  transport?: ReminderTransport;
  outputPath?: string | null;
};

export type ReminderSweepResult = {
  runAt: string;
  remindersSent: number;
  dueSoonCount: number;
  overdueCount: number;
  outputPath: string | null;
};

export function createTaskReminderService(database: DatabaseSync, options?: ReminderServiceOptions) {
  const channel = options?.channel ?? "email";
  const lookaheadHours = options?.lookaheadHours ?? 48;
  const transport = options?.transport ?? (options?.outputPath === null ? "console" : "file");
  const outputPath = options?.outputPath === undefined ? path.resolve(process.cwd(), "task-reminders.log") : options.outputPath;

  const getReminderCandidates = database.prepare(`
    SELECT
      tasks.id AS task_id,
      tasks.title AS task_title,
      categories.name AS category_name,
      tasks.expiry_at,
      users.id AS user_id,
      users.name AS user_name,
      users.email AS user_email
    FROM tasks
    INNER JOIN users ON users.id = tasks.user_id
    INNER JOIN categories ON categories.id = tasks.category_id
    WHERE tasks.archived_at IS NULL
      AND tasks.trashed_at IS NULL
      AND tasks.expiry_at IS NOT NULL
    ORDER BY tasks.expiry_at ASC
  `);

  const reminderExists = database.prepare(`
    SELECT id
    FROM task_reminders
    WHERE task_id = :taskId
      AND reminder_type = :reminderType
      AND channel = :channel
  `);

  const insertReminder = database.prepare(`
    INSERT INTO task_reminders (id, task_id, user_id, reminder_type, channel, sent_at, created_at)
    VALUES (:id, :taskId, :userId, :reminderType, :channel, :sentAt, :createdAt)
  `);

  function getReminderType(expiryAt: string, referenceTime = Date.now()): ReminderType | null {
    const expiryTime = new Date(expiryAt).getTime();

    if (Number.isNaN(expiryTime)) {
      return null;
    }

    if (expiryTime <= referenceTime) {
      return "overdue";
    }

    const lookaheadMs = lookaheadHours * 60 * 60 * 1000;
    return expiryTime - referenceTime <= lookaheadMs ? "due-soon" : null;
  }

  function deliverReminder(entry: ReminderEntry, sentAt: string) {
    const payload = JSON.stringify({
      sentAt,
      channel,
      ...entry,
    });

    if (transport === "silent") {
      return;
    }

    if (transport === "console") {
      console.log(payload);
      return;
    }

    if (!outputPath) {
      return;
    }

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.appendFileSync(outputPath, `${payload}\n`, "utf8");
  }

  function runSweep(referenceTime = Date.now()): ReminderSweepResult {
    const candidates = getReminderCandidates.all() as ReminderCandidateRow[];
    const sentAt = nowIso();
    let remindersSent = 0;
    let dueSoonCount = 0;
    let overdueCount = 0;

    for (const candidate of candidates) {
      const reminderType = getReminderType(candidate.expiry_at, referenceTime);

      if (!reminderType) {
        continue;
      }

      const existingReminder = reminderExists.get({
        taskId: candidate.task_id,
        reminderType,
        channel,
      }) as { id: string } | undefined;

      if (existingReminder) {
        continue;
      }

      insertReminder.run({
        id: createId(),
        taskId: candidate.task_id,
        userId: candidate.user_id,
        reminderType,
        channel,
        sentAt,
        createdAt: sentAt,
      });

      deliverReminder(
        {
          userId: candidate.user_id,
          userName: candidate.user_name,
          userEmail: candidate.user_email,
          taskId: candidate.task_id,
          taskTitle: candidate.task_title,
          categoryName: candidate.category_name,
          expiryAt: candidate.expiry_at,
          reminderType,
        },
        sentAt,
      );

      remindersSent += 1;

      if (reminderType === "due-soon") {
        dueSoonCount += 1;
      } else {
        overdueCount += 1;
      }
    }

    return {
      runAt: sentAt,
      remindersSent,
      dueSoonCount,
      overdueCount,
      outputPath: transport === "file" ? outputPath ?? null : null,
    };
  }

  return {
    runSweep,
    getReminderType,
  };
}
