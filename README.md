# TechLint To-Do Board

A full-stack To-Do Board built for the TechLint mid-level developer practical test.

## What this project includes

- Register and login with secure cookie-based sessions
- Private boards for each user account
- Custom categories like `To Do`, `In Progress`, and `Done`
- Task cards with title, description, expiry date, comments, and native drag-and-drop movement
- Description autosave for interrupted editing
- Expiry warnings with badges and toast notifications
- Task activity history and per-task comment log
- Responsive board layout with focus mode and browser full screen
- SQLite storage instead of MySQL
- Automated tests and markdown documentation

## Tech stack

- React 19
- Tailwind CSS
- Express 5
- SQLite using Node's built-in `node:sqlite`
- Vitest, Testing Library, and Supertest
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
- `npm test` runs the automated tests

## Usage flow

1. Register a new account.
2. Use the default categories or create new ones.
3. Add tasks inside a category.
4. Drag tasks across the board or reorder them inside the same category.
5. Select a task to edit details, add comments, and check its history.
6. Watch expiry badges, toast alerts, and the notifications tab.
7. Use `Focus board` or browser full screen when you want more drag space.

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
