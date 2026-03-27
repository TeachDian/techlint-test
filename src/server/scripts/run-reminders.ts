import { createDatabase } from "../db/database.js";
import { createTaskReminderService } from "../services/task-reminder-service.js";

const database = createDatabase(process.env.DATABASE_PATH);
const reminderService = createTaskReminderService(database, {
  channel: process.env.REMINDER_CHANNEL,
  lookaheadHours: process.env.REMINDER_LOOKAHEAD_HOURS ? Number(process.env.REMINDER_LOOKAHEAD_HOURS) : undefined,
  outputPath: process.env.REMINDER_OUTPUT_PATH === "" ? null : process.env.REMINDER_OUTPUT_PATH,
  transport: process.env.REMINDER_TRANSPORT as "file" | "console" | "silent" | undefined,
});

try {
  const result = reminderService.runSweep();
  console.log(
    JSON.stringify({
      status: "ok",
      ...result,
    }),
  );
} finally {
  database.close();
}
