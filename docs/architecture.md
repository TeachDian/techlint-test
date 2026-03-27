# Architecture Notes

I kept the architecture simple because this is a take-home project, not a production platform.

## Main split

The app has two parts:

- React + Tailwind on the client
- Express + SQLite on the server

In development, Vite serves the frontend and the API runs separately. In production, Express also serves the built frontend.

## Why SQLite

The brief suggested MySQL, but I used SQLite for a practical reason: it removes the need for a separate database server while still keeping the data relational.

That gave me:

- faster setup
- easier testing
- simpler Docker support
- less friction for review

## Authentication

Authentication uses cookie sessions.

A short version of the flow:

1. A user registers or signs in.
2. The server creates a random session token.
3. Only the token hash is stored in the database.
4. The raw token is sent back as an HTTP-only cookie.
5. Every protected request resolves the current user from that cookie.

I avoided local-storage auth tokens here because cookie sessions fit this app better.

## Data ownership

Every main board record belongs to a user.

That includes:

- stages
- tasks
- comments
- badges
- filter presets
- reminders
- history
- sessions

The board service always filters by `user_id`, so one account cannot see another account's data.

## Board model

The UI calls board columns `stages`.

In the API and database, they are still stored as `categories`. I kept that name to avoid a large rename after the structure was already stable.

A task includes:

- title
- description
- expiry date
- priority
- draft save timestamp
- archive state
- trash state
- delete-after date

## Drag and drop

The board uses the native HTML Drag and Drop API.

I split the logic so it stays readable:

- `use-board-drag.ts` handles task payloads and task drop targets
- `use-category-drag.ts` handles stage dragging
- `use-drag-scroll.ts` handles horizontal board dragging
- `drag-preview.ts` builds the custom drag preview element

I kept it library-free to match the test brief.

## Task editing

The task editor saves changes as the user works.

Important details:

- title is required
- description is editable and autosaved
- expiry date drives the due-soon and overdue states
- comments and history sit in the same side panel so the full task story is visible in one place

## Extra workflow features

I added a few things that stay close to the original brief:

- badge repository
- task priority
- saved filter presets
- archive and trash workspace
- bulk actions
- keyboard task movement
- mobile stage tabs

These are not random extras. They all improve the board without changing its main purpose.

## Reminder design

The reminder feature is local-first.

Right now it can:

- find due-soon tasks
- find overdue tasks
- avoid duplicate sends for the same task and reminder type
- write output to a file, console, or a silent transport

I did not wire a real email provider because that felt outside the core brief, but the service is structured so that can be added later.

## Folder layout

```text
src/
  client/
    components/
    contexts/
    hooks/
    lib/
  server/
    db/
    middleware/
    routes/
    services/
    scripts/
  shared/
  tests/
```

## Closing note

The whole project is built around one idea: keep the code easy to change. That is why the board behavior is split into small hooks and the backend logic lives in service modules instead of route files.
