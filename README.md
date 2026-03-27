# TechLint To-Do Board

A full-stack To-Do Board built for the TechLint mid-level developer practical test.

## What this project includes

- Register and login with secure cookie-based sessions
- Private boards for each user account
- Custom categories like `To Do`, `In Progress`, and `Done`
- Task cards with title, description, expiry date, and drag-and-drop movement
- Description autosave for interrupted editing
- Expiry warnings with badges and toast notifications
- Task movement history
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
4. Click a task to open the editor.
5. Update the description and watch the draft autosave status.
6. Drag tasks between categories.
7. Watch expiry badges, toast alerts, and recent activity.

## Important note about SQLite

This project uses Node's built-in `node:sqlite` module. It works on Node 22+, but Node may still print an experimental warning in the terminal. The app and tests still work correctly.

## Documentation

- `docs/setup-guide.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/testing.md`
- `docs/git-stages.md`
- `docs/case-study.md`
