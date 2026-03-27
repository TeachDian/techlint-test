# API Notes

All API routes are under `/api`.

## Auth routes

### `GET /api/auth/session`
Returns the current signed-in user or `null`.

### `POST /api/auth/register`
Creates a user account, seeds starter board data, and signs the user in.

### `POST /api/auth/login`
Signs an existing user in.

### `POST /api/auth/logout`
Clears the current session.

## Board routes

These routes require a signed-in user.

### `GET /api/board`
Returns the full board snapshot.

Response shape:

```json
{
  "board": {
    "categories": [],
    "tasks": [],
    "history": [],
    "comments": [],
    "badgeDefinitions": [],
    "taskBadges": [],
    "filterPresets": []
  }
}
```

### `POST /api/board/categories`
Creates a new category.

### `POST /api/board/categories/:categoryId/move`
Reorders a category on the board.

```json
{
  "position": 0
}
```

### `POST /api/board/badges`
Creates a badge definition.

```json
{
  "title": "Release",
  "description": "Release work",
  "color": "#0f766e"
}
```

### `PATCH /api/board/badges/:badgeId`
Updates a badge definition.

### `DELETE /api/board/badges/:badgeId`
Removes a badge definition and its task assignments.

### `POST /api/board/filter-presets`
Creates a saved filter preset.

```json
{
  "name": "Urgent release",
  "query": "release",
  "startDate": "2026-04-01",
  "endDate": "2026-04-30",
  "priority": "urgent",
  "badgeId": "uuid"
}
```

### `PATCH /api/board/filter-presets/:presetId`
Updates a saved filter preset.

### `DELETE /api/board/filter-presets/:presetId`
Deletes a saved filter preset.

### `POST /api/board/tasks`
Creates a task in a category.

```json
{
  "categoryId": "uuid",
  "title": "Write release notes",
  "description": "Draft version",
  "expiryAt": "2026-04-12T09:00:00.000Z",
  "priority": "high",
  "badgeIds": ["uuid"]
}
```

### `PATCH /api/board/tasks/:taskId`
Updates title, description, expiry date, priority, or badge assignments.

### `POST /api/board/tasks/:taskId/move`
Moves a task to another category or swaps it with another task.

```json
{
  "categoryId": "uuid",
  "position": 0,
  "swapWithTaskId": null
}
```

### `POST /api/board/tasks/:taskId/comments`
Adds a comment to a task.

### `POST /api/board/tasks/:taskId/archive`
Moves a task into archive.

### `POST /api/board/tasks/:taskId/trash`
Moves a task into trash and starts the 30-day delete window.

### `POST /api/board/tasks/:taskId/restore`
Restores a task from archive or trash.

### `DELETE /api/board/tasks/:taskId`
Deletes a task permanently.

## Reminder sweep script

### `npm run reminders`
Runs the local reminder sweep.

Default behavior:

- checks active tasks with expiry dates
- logs one `due-soon` or `overdue` reminder per task and status
- writes JSON lines to `task-reminders.log`

Useful environment values:

- `REMINDER_TRANSPORT=file|console|silent`
- `REMINDER_OUTPUT_PATH=custom-path.log`
- `REMINDER_LOOKAHEAD_HOURS=48`
- `REMINDER_CHANNEL=email`

## Error format

Errors return simple JSON.

```json
{
  "message": "Please check the form and try again.",
  "fieldErrors": {
    "email": "Enter a valid email address."
  }
}
```
