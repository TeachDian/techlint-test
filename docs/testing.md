# Testing Guide

## Automated test commands

Run the main test suite with:

```bash
npm test
```

Run the browser end-to-end suite with:

```bash
npm run test:e2e
```

## What the automated tests cover

### API tests

- User registration
- Starter board seeding
- Private account data isolation
- Stage reordering
- Task creation
- Draft update saving
- Task comments
- Badge creation, update, and removal
- Saved filter preset create, update, and delete
- Task movement
- Archive, trash, and restore flows

### Client tests

- Expiry state helper logic
- Datetime conversion helper logic
- Drag helper logic
- Keyboard move helper logic
- Task card rendering

### Server utility tests

- Reminder sweep behavior
- One-time reminder dispatch per task and reminder type

### Playwright tests

- Register through the browser
- Reorder a stage with native drag and drop
- Drag a seeded ticket
- Toggle compact view
- Archive it from the workspace
- Move it to trash
- Restore it back to the board

## Supporting commands

```bash
npm run check
npm run build
npm run reminders
```

Use these when you want extra safety before pushing changes.

## Suggested manual checks

1. Register a fresh account and confirm starter tickets appear.
2. Reorder a stage and refresh the page.
3. Drag a ticket to the top of a column.
4. Drag a ticket over another ticket and confirm the swap behavior.
5. Focus a task card and move it with `Alt+Shift+Arrow` keys.
6. Save a filter preset and apply it again.
7. Toggle compact view and confirm cards get denser.
8. Edit a badge in the workspace and confirm task chips update.
9. Open `More` and review the archive, trash, bulk actions, and badge repository.
10. Move a task to trash and restore it.
11. Run `npm run reminders` and check the output log.

## Test files

- `src/tests/api/app.test.ts`
- `src/tests/client/date-utils.test.ts`
- `src/tests/client/board-drag.test.ts`
- `src/tests/client/task-card.test.tsx`
- `src/tests/client/task-keyboard-move.test.ts`
- `src/tests/server/task-reminder-service.test.ts`
- `src/tests/e2e/board-lifecycle.spec.ts`
