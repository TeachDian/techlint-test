# API Notes

All API routes are under `/api`.

## Auth routes

### `GET /api/auth/session`
Returns the current signed-in user or `null`.

### `POST /api/auth/register`
Creates a user account and signs the user in.

Request body:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123"
}
```

### `POST /api/auth/login`
Signs an existing user in.

Request body:

```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

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
    "comments": []
  }
}
```

### `POST /api/board/categories`
Creates a new category.

```json
{
  "name": "Blocked"
}
```

### `POST /api/board/tasks`
Creates a task in a category.

```json
{
  "categoryId": "uuid",
  "title": "Write release notes",
  "description": "Draft version",
  "expiryAt": "2026-04-12T09:00:00.000Z"
}
```

### `PATCH /api/board/tasks/:taskId`
Updates title, description, or expiry date.

```json
{
  "title": "Write release notes",
  "description": "Final draft",
  "expiryAt": "2026-04-13T09:00:00.000Z"
}
```

### `POST /api/board/tasks/:taskId/move`
Moves a task to another category or position.

```json
{
  "categoryId": "uuid",
  "position": 0
}
```

### `POST /api/board/tasks/:taskId/comments`
Adds a comment to a task.

```json
{
  "body": "Need approval from the product owner."
}
```

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
