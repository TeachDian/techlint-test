# API Notes

All routes are under `/api`.

The UI uses the word `stage`, but the API still uses `category` in route names and payloads.

## Auth

### `GET /api/auth/session`
Returns the current signed-in user or `null`.

### `POST /api/auth/register`
Creates a user, seeds starter board data, and signs the user in.

Request body:

```json
{
  "name": "Abdul Jabar",
  "email": "abdul@example.com",
  "password": "password123"
}
```

### `POST /api/auth/login`
Signs in an existing user.

### `POST /api/auth/logout`
Clears the session cookie.

## Board snapshot

### `GET /api/board`
Returns the full board for the current user.

Main response shape:

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

## Stages

### `POST /api/board/categories`
Creates a stage.

```json
{
  "name": "Blocked"
}
```

### `POST /api/board/categories/:categoryId/move`
Moves a stage to a new position.

```json
{
  "position": 1
}
```

### `DELETE /api/board/categories/:categoryId`
Deletes a stage.

The backend only allows this when the stage is empty.

## Tasks

### `POST /api/board/tasks`
Creates a task.

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
Updates task fields.

Supported fields:

- `title`
- `description`
- `expiryAt`
- `priority`
- `badgeIds`

### `POST /api/board/tasks/:taskId/move`
Moves a task or swaps it with another task.

```json
{
  "categoryId": "uuid",
  "position": 0,
  "swapWithTaskId": null
}
```

### `POST /api/board/tasks/:taskId/comments`
Adds a comment.

```json
{
  "body": "Please check this before release."
}
```

### `POST /api/board/tasks/:taskId/archive`
Archives a task.

### `POST /api/board/tasks/:taskId/trash`
Moves a task to trash.

### `POST /api/board/tasks/:taskId/restore`
Restores a task from archive or trash.

### `DELETE /api/board/tasks/:taskId`
Deletes a task permanently.

## Badges

### `POST /api/board/badges`
Creates a badge definition.

```json
{
  "title": "Client review",
  "description": "Use this when the task needs a client sign-off before closing.",
  "color": "#0f766e"
}
```

### `PATCH /api/board/badges/:badgeId`
Updates a badge definition.

### `DELETE /api/board/badges/:badgeId`
Deletes a badge definition and removes its task assignments.

## Filter presets

### `POST /api/board/filter-presets`
Creates a filter preset.

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
Updates a preset.

### `DELETE /api/board/filter-presets/:presetId`
Deletes a preset.

## Reminder script

### `npm run reminders`
Runs the reminder sweep from source.

### `npm run reminders:prod`
Runs the built reminder sweep after a production build.

Useful reminder environment values:

- `REMINDER_TRANSPORT=file|console|silent`
- `REMINDER_OUTPUT_PATH=custom-path.log`
- `REMINDER_LOOKAHEAD_HOURS=48`
- `REMINDER_CHANNEL=email`

## Error shape

Errors come back as simple JSON.

```json
{
  "message": "Please check the form and try again.",
  "fieldErrors": {
    "email": "Enter a valid email address."
  }
}
```
