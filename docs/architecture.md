# Architecture

## Goal

Build a clean, modular To-Do Board with private user data, native drag-and-drop, keyboard movement, task comments, badges, filtering, archive/trash support, and strong local developer setup.

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
- `badge_definitions.user_id`
- `task_badges.user_id`
- `filter_presets.user_id`
- `task_reminders.user_id`
- `sessions.user_id`

Every important query filters by `user_id`. This keeps one user's tasks, comments, badges, presets, and archive data private.

## Authentication and starter data

Authentication uses secure cookie sessions.

- Passwords are hashed with `scrypt`
- A random session token is created on login or register
- Only the token hash is stored in the database
- The browser gets the token in an HTTP-only cookie
- The server reads the cookie and loads the current user on each request

A new account is seeded with:

- Default categories
- Starter badge definitions
- Starter tickets and a sample comment

## Database tables

- `users`: account records
- `sessions`: active login sessions
- `categories`: board columns per user
- `tasks`: task cards per user
- `task_history`: task activity log
- `task_comments`: comment log per task
- `badge_definitions`: reusable badge repository per user
- `task_badges`: task-to-badge assignments
- `filter_presets`: saved board filter views per user
- `task_reminders`: reminder dispatch log per task and reminder type

## Task lifecycle

A task can be in one of three working states.

- Active on the board
- Archived
- In trash

Trash items are kept for 30 days. Expired trash items are cleaned automatically when the board is loaded.

## Frontend state design

The frontend uses focused contexts and hooks.

- `AuthContext`: current user, login, register, logout, session refresh
- `BoardContext`: board data, selected task, badge actions, filter preset actions, and lifecycle actions
- `ToastContext`: notifications
- `use-board-drag.ts`: drag payloads, drop targets, and swap/before/after logic
- `use-drag-scroll.ts`: horizontal drag-scroll on the board surface
- `use-resizable-panel.ts`: resizable inspector width on desktop
- `task-keyboard-move.ts`: keyboard move payloads for focused task cards

## Drag-and-drop and keyboard design

The board uses the HTML Drag and Drop API directly.

- Gap drop zones support insert-at-top and insert-at-end
- Card hover targets support `before`, `after`, and `swap`
- The backend updates final task positions in a transaction
- No external drag-and-drop library is used
- Focused cards also support `Alt+Shift+Arrow` movement for accessibility and fast keyboard workflows

## Task metadata design

Each task supports more than the base title and description.

- Expiry date
- Priority
- Comments
- Badge assignments
- Archive and trash state

Badges come from a user-owned badge repository, so the task only stores assignments while the badge definition stores title, color, and hidden description.

## Filter preset design

Board filters can be saved per account.

- Each preset stores name, query, start date, end date, priority, and badge selection
- Presets are returned in the normal board payload
- The client applies presets without reloading the page

## Reminder design

Reminder support is optional and local-first.

- `task-reminder-service.ts` finds due soon and overdue active tasks
- Reminder dispatches are logged in `task_reminders` so each task/status pair is only sent once per channel
- `npm run reminders` runs the sweep manually
- The default transport writes JSON lines to a local log file, but the service can later be extended to a real mail provider

## Responsive UI design

The board stays usable on smaller screens.

- Columns scroll horizontally
- The board surface supports drag-scroll with the mouse
- The inspector becomes an overlay and fills the screen on smaller layouts
- The `More` workspace also works as a full-screen management view
- Bulk actions stay available in the workspace on both desktop and mobile layouts

## Naming and modularity

Client component file names use kebab-case.

Examples:

- `board-page.tsx`
- `board-workspace.tsx`
- `task-editor.tsx`
- `task-badge-list.tsx`
- `board-filter-presets.tsx`
- `use-board-drag.ts`

This keeps the file structure easier to scan and separates layout, metadata, keyboard movement, and drag behavior into smaller pieces.

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
    scripts/
  shared/
    api.ts
  tests/
    api/
    client/
    e2e/
    server/
```

## Why SQLite was chosen

The task brief suggested MySQL, but SQLite matches the current goal better.

- Easier local setup
- No external database server needed
- Good fit for this practical test
- Still relational and structured
