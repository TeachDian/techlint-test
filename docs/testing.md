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

### Client tests

- Expiry state helper logic
- Datetime conversion helper logic
- Task card rendering

## Supporting commands

```bash
npm run check
npm run build
```

Use these when you want extra safety before pushing changes.

## Suggested manual checks

1. Register two different users.
2. Confirm they do not share categories or tasks.
3. Create a task with an expiry date.
4. Edit the description and wait for the draft saved message.
5. Drag the task to another category.
6. Check the recent activity panel.
7. Create a task with a near expiry date and check the warning badge and toast.

## Test files

- `src/tests/api/app.test.ts`
- `src/tests/client/date-utils.test.ts`
- `src/tests/client/task-card.test.tsx`
