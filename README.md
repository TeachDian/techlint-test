# TechLint To-Do Board

A full-stack To-Do Board built for the TechLint mid-level developer practical test.

## What this project includes

- Register and login with secure cookie-based sessions
- Private boards for each user account
- Starter categories, starter badges, and starter tickets for first-use examples
- Native drag-and-drop task movement without a third-party drag library
- Drop before, drop after, and card swap behavior
- Keyboard-first task movement with `Alt+Shift+Arrow` keys
- Full-screen board layout with drag-scroll for the board surface
- Resizable task inspector panel that overlays the board on larger screens
- Task editing with autosave draft support
- Task comments and activity history
- Badge repository with create, edit, delete, colored labels, and tooltip details
- Search, date range, badge, and priority filtering
- Saved filter presets per user account
- Archive and trash flows with 30-day trash retention
- Bulk archive, trash, restore, and delete actions in the workspace
- Priority-based card color accents
- Optional reminder sweep script for due soon and overdue tasks
- SQLite storage instead of MySQL
- Automated unit, API, and Playwright end-to-end tests
- Markdown documentation and delivery notes

## Tech stack

- React 19
- Tailwind CSS
- Express 5
- SQLite using Node's built-in `node:sqlite`
- Vitest, Testing Library, Supertest, and Playwright
- TypeScript on both client and server

## Requirements

- Node.js 22 or newer
- npm 11 or newer

## Quick start

1. Install dependencies:
   `npm install`
2. Copy environment values if you want custom settings:
   `copy .env.example .env`
3. Start the app in development mode:
   `npm run dev`
4. Open the UI:
   `http://localhost:5173`

If PowerShell blocks `npm.ps1`, run the commands with `cmd /c`, for example:
`cmd /c npm run dev`

## Main scripts

- `npm run dev` starts the Vite frontend and Express API together
- `npm run build` builds the client and server for production
- `npm start` runs the production server after build
- `npm run check` runs TypeScript checks
- `npm test` runs the Vitest and API test suite
- `npm run test:e2e` runs the Playwright browser test suite
- `npm run reminders` runs the optional reminder sweep script

## Usage flow

1. Register a new account.
2. Review the seeded example tasks and badge setup.
3. Add tasks or create categories.
4. Drag tasks across the board, to the top of a list, or over another task to swap.
5. Use `Alt+Shift+Arrow` while a task card is focused to move it with the keyboard.
6. Select a task to edit details, comments, badges, and priority.
7. Use search, filters, and saved presets to narrow the visible board.
8. Open `More` to manage tickets, archive, trash, bulk actions, and the badge repository.

## Important note about SQLite

This project uses Node's built-in `node:sqlite` module. It works on Node 22+, but Node may still print an experimental warning in the terminal. The app and tests still work correctly.

## Documentation

- `docs/setup-guide.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/testing.md`
- `docs/git-stages.md`
- `docs/improvements.md`
- `docs/checklist.md`
- `docs/case-study.md`
