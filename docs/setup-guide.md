# Setup Guide

This guide uses simple English and short steps.

## 1. Install Node.js

Use Node.js 22 or newer.

Check your version:

```bash
node -v
npm -v
```

## 2. Install the project packages

```bash
npm install
```

If PowerShell blocks `npm.ps1`, use this instead:

```bash
cmd /c npm install
```

## 3. Optional environment setup

Copy `.env.example` to `.env` if you want to change the defaults.

Default values:

- `PORT=3001`
- `DATABASE_PATH=todo-board.sqlite`
- `NODE_ENV=development`
- `REMINDER_TRANSPORT=file`
- `REMINDER_OUTPUT_PATH=task-reminders.log`
- `REMINDER_LOOKAHEAD_HOURS=48`
- `REMINDER_CHANNEL=email`

## 4. Run the app in development mode

```bash
npm run dev
```

This starts:

- Frontend on `http://localhost:5173`
- API on `http://localhost:3001`

## 5. Open the app

Open `http://localhost:5173` in your browser.

## 6. Basic usage

- Register an account
- Review the starter tasks and starter badges
- Add or edit tickets
- Drag tickets across the board, to the top of a column, or over another ticket to swap
- Focus a ticket card and use `Alt+Shift+Arrow` keys to move it with the keyboard
- Use the search bar, filters, and saved presets
- Open a ticket to edit details, comments, badges, and priority
- Open `More` to manage archive, trash, bulk actions, and the badge repository

## 7. Build for production

```bash
npm run build
npm start
```

## 8. Run the tests

```bash
npm test
npm run test:e2e
```

## 9. Run the reminder sweep

```bash
npm run reminders
```

This writes reminder output to `task-reminders.log` by default.

## Common notes

- The SQLite file is created automatically.
- Each account gets its own data.
- Trash items stay for 30 days before automatic cleanup.
- Node may show an experimental warning for `node:sqlite`. This is expected on Node 22.
- On smaller screens, the details panel becomes an overlay.
- Playwright may download Chromium the first time you prepare the e2e test setup.
