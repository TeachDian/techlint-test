# Testing Notes

I used three layers of testing here: unit-level client tests, API tests, and one browser flow.

## Main commands

```bash
npm run check
npm test
npm run test:e2e
npm run build
```

## What is covered

### `npm test`
This runs Vitest for both client and server-side tests.

Current coverage includes:

- user registration and starter data
- user data isolation
- task moves and swap logic
- comments, archive, trash, restore, and empty-stage delete flows
- keyboard move helper logic
- task card rendering
- reminder sweep behavior

### `npm run test:e2e`
This runs the Playwright browser flow.

The current browser test covers:

- register a new account
- reorder a stage
- move a task by drag and drop
- switch to compact view
- archive a task
- move it to trash
- restore it back to the board

## Manual checks I would still do before submission

1. Register a fresh account.
2. Open a task and confirm autosave updates the saved timestamp.
3. Move a task to the top of another stage.
4. Drop one task over another and confirm the swap result.
5. Drag a stage left or right.
6. Check due-soon and overdue visual states.
7. Save and re-apply a filter preset.
8. Open `More` and check archive, trash, badges, and bulk actions.
9. Resize the details panel on desktop.
10. Check the mobile layout in browser dev tools.

## One note about Playwright

On a machine that has never used Playwright before, Chromium may need to be installed once:

```bash
npx playwright install chromium
```

## Test files

- `src/tests/api/app.test.ts`
- `src/tests/client/board-drag.test.ts`
- `src/tests/client/date-utils.test.ts`
- `src/tests/client/task-card.test.tsx`
- `src/tests/client/task-keyboard-move.test.ts`
- `src/tests/server/task-reminder-service.test.ts`
- `src/tests/e2e/board-lifecycle.spec.ts`
