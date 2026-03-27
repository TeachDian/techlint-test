# Setup Guide

This is the simplest way to run the project on your machine without Docker.

## What you need

- Node.js 22 or newer
- npm 11 or newer

Check your versions if you want:

```bash
node -v
npm -v
```

## 1. Install packages

```bash
npm install
```

If PowerShell blocks `npm.ps1`, use:

```bash
cmd /c npm install
```

## 2. Optional environment file

You can copy `.env.example` to `.env` if you want to change ports or file paths.

Default values:

- `PORT=3001`
- `DATABASE_PATH=todo-board.sqlite`
- `NODE_ENV=development`
- `REMINDER_TRANSPORT=file`
- `REMINDER_OUTPUT_PATH=task-reminders.log`
- `REMINDER_LOOKAHEAD_HOURS=48`
- `REMINDER_CHANNEL=email`

## 3. Start the app

```bash
npm run dev
```

That starts:

- Vite frontend on `http://localhost:5173`
- Express API on `http://localhost:3001`

## 4. Open the board

Go to `http://localhost:5173`.

Create an account first. A new account gets starter stages, starter tasks, and starter badges so the board is not empty on first load.

## 5. Common workflow

A normal quick check looks like this:

1. Create an account.
2. Open one of the starter tasks.
3. Edit the description and wait for autosave.
4. Drag a task to another stage.
5. Drag a stage left or right.
6. Open `More` and check archive, trash, and badges.
7. Use the filters and save a preset.

## 6. Run checks before committing

```bash
npm run check
npm test
npm run test:e2e
npm run build
```

## 7. Run the reminder sweep

```bash
npm run reminders
```

By default, the reminder output is written to `task-reminders.log`.

## Notes

- SQLite files are created automatically.
- Data is private per user account.
- Trash items are kept for 30 days.
- On smaller screens, the details panel opens as an overlay.
- Playwright may need a one-time Chromium install on a fresh machine.
- If you want Docker instead, use [docker.md](docker.md).

