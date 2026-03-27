# Architecture

## Goal

Build a clean, modular To-Do Board with user authentication, private account data, drag-and-drop movement, autosave, expiry alerts, task comments, and tests.

## High-level design

The app is split into two clear parts.

- Frontend: React + Tailwind CSS
- Backend: Express + SQLite

The frontend talks to the backend through JSON API routes under `/api`.

## Multi-user data isolation

Every board record is linked to a user.

- `categories.user_id`
- `tasks.user_id`
- `task_history.user_id`
- `task_comments.user_id`
- `sessions.user_id`

Every important query filters by `user_id`. This is what keeps one user's tasks and comments from showing in another user's board.

## Authentication design

Authentication uses secure cookie sessions.

- Passwords are hashed with `scrypt`
- A random session token is created on login or register
- Only the token hash is stored in the database
- The browser gets the token in an HTTP-only cookie
- The server reads the cookie and loads the current user on each request

This keeps the session token out of normal frontend JavaScript.

## Database tables

- `users`: account records
- `sessions`: active login sessions
- `categories`: board columns per user
- `tasks`: task cards per user
- `task_history`: movement and update history
- `task_comments`: comment log per task

## Frontend state design

The frontend uses small focused contexts.

- `AuthContext`: current user, login, register, logout, session refresh
- `BoardContext`: board data, selected task, board actions, task comments
- `ToastContext`: notifications

This keeps state reusable and avoids one large component owning everything.

## Drag-and-drop design

The board uses the HTML Drag and Drop API directly.

- `use-board-drag.ts` owns drag payloads, drop targets, and move handling
- `board-page.tsx` stays focused on layout and board-level behavior
- `board-column.tsx` only renders columns and drop zones
- SQLite updates the final card positions in a transaction

No external drag-and-drop library is used.

## Autosave and comments

The task editor watches title, description, and expiry changes.

- The editor waits briefly after the user stops typing
- The latest draft is sent to the API
- Save status is shown in simple English
- The task stores `draft_saved_at`

The task editor also supports comments.

- Comments are saved in `task_comments`
- A comment updates task activity
- The board payload returns comments so the sidebar can render them without extra requests

## Responsive UI design

The board layout is built to stay usable on smaller screens.

- Columns scroll horizontally
- The details sidebar stacks under the board on smaller screens
- Focus mode hides the sidebar when the board needs more space
- Browser full screen is available for drag-heavy work

## Naming and modularity

Client component file names use kebab-case.

Examples:

- `board-page.tsx`
- `task-editor.tsx`
- `task-comments-panel.tsx`
- `use-board-drag.ts`

This keeps the file structure easier to scan and keeps board logic separate from UI details.

## Main folders

```text
src/
  client/
    components/
    contexts/
    hooks/
    lib/
  server/
    db/
    lib/
    middleware/
    routes/
    services/
  shared/
    api.ts
  tests/
    api/
    client/
```

## Why SQLite was chosen

The task brief suggested MySQL, but SQLite matches the current goal better.

- Easier local setup
- No external database server needed
- Good fit for this practical test
- Still relational and structured
