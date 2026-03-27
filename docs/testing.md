# Testing Guide

## Automated test command

Run all tests with:

```bash
npm test
```

## What the automated tests cover

### API tests

- User registration
- Default category seeding
- Private account data isolation
- Task creation
- Draft update saving
- Task movement history
- Task comments

### Client tests

- Expiry state helper logic
- Datetime conversion helper logic
- Task card rendering
- Drag helper logic

## Supporting commands

```bash
npm run check
npm run build
```

Use these when you want extra safety before pushing changes.

## Suggested manual checks

1. Register two different users.
2. Confirm they do not share categories, tasks, or comments.
3. Create a task with an expiry date.
4. Edit the description and wait for the draft saved message.
5. Add a comment to the task.
6. Drag the task to another category.
7. Check the activity and notifications tabs.
8. Resize the screen to mobile width and confirm the board still works.

## Test files

- `src/tests/api/app.test.ts`
- `src/tests/client/date-utils.test.ts`
- `src/tests/client/task-card.test.tsx`
- `src/tests/client/board-drag.test.ts`
