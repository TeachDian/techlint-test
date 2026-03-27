# TechLint To-Do Board

This repo is my submission for the TechLint mid-level developer practical test.

I kept the stack small on purpose: React on the client, Express on the server, and SQLite for storage. The goal was to cover the brief well, keep the code easy to follow, and avoid setup friction.

## What is in the app

- Cookie-based authentication with register and sign-in flows
- One private board per user account
- Stages that can be created, reordered, and removed when empty
- Tasks with title, description, expiry date, priority, comments, and badges
- Draft autosave while editing a task
- Native HTML drag and drop for both stages and task cards
- Expiry warnings through visual status and toast messages
- Task history so moves and updates are visible
- Search, date range, badge, and priority filters
- Saved filter presets per user
- Archive and trash flows with restore support
- Responsive board layout with a resizable details panel
- Optional reminder sweep script
- Automated tests for API, client helpers, and browser flow
- Optional Docker setup for running the app in one container

## Stack

- React 19
- Tailwind CSS
- Express 5
- TypeScript
- SQLite through Node's built-in `node:sqlite`
- Vitest, Testing Library, Supertest, and Playwright

## Local run

Requirements:

- Node.js 22+
- npm 11+

Install and start:

```bash
npm install
copy .env.example .env
npm run dev
```

Open:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

Copying `.env.example` is optional. The app will still run with the defaults.

## Docker run

If you want a container setup instead of a local Node setup:

```bash
docker compose up --build
```

Open:

- App: `http://localhost:3001`

In Docker, the Express server serves the built frontend and API from the same container. SQLite data is stored in a Docker volume so it survives container restarts.

To stop it:

```bash
docker compose down
```

## Main commands

- `npm run dev` starts the frontend and API in development mode
- `npm run build` creates the production build
- `npm start` runs the production server
- `npm run check` runs TypeScript checks
- `npm test` runs unit and API tests
- `npm run test:e2e` runs the Playwright browser test
- `npm run reminders` runs the reminder sweep from source
- `npm run reminders:prod` runs the built reminder script after `npm run build`
- `npm run docker:up` starts the Docker setup
- `npm run docker:down` stops the Docker setup

## Project notes

- The UI uses the word `stage`, but some API and database names still use `category`. I kept that naming because it was already stable in the code.
- SQLite was used instead of MySQL because it is still relational, but much easier to run for this kind of take-home test.
- Node may print an experimental warning for `node:sqlite` on Node 22. That is expected here.

## Documentation

- [setup-guide.md](docs/setup-guide.md)
- [docker.md](docs/docker.md)
- [architecture.md](docs/architecture.md)
- [api.md](docs/api.md)
- [testing.md](docs/testing.md)
- [git-stages.md](docs/git-stages.md)
- [improvements.md](docs/improvements.md)
- [checklist.md](docs/checklist.md)
- [case-study.md](docs/case-study.md)

