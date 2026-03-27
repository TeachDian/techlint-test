# Improvements Log

This file tracks the main quality-of-life improvements added after the first working version.

## Board interaction

- Fixed the top drop zone so tasks can be inserted at the first position of a populated column
- Added card-level drag targets for `before`, `after`, and `swap`
- Added horizontal drag-scroll for the full board surface
- Upgraded board drag-scroll to pointer-based dragging and desktop wheel side-scrolling
- Added stage reordering with native drag and drop
- Added floating drag previews and stronger stage/task drop highlights
- Made task drops more forgiving by using wider card hit zones and whole-column stack targeting
- Made stage reordering more forgiving by allowing drops on full column frames, not only narrow gutters
- Kept far-right stages reachable while the inspector is open by reserving board space behind it
- Added move toasts when a ticket stage changes
- Added keyboard movement with `Alt+Shift+Arrow` shortcuts

## Task metadata

- Added per-task comments
- Added reusable badge definitions with title, color, and hidden tooltip details
- Added badge assignment on tickets
- Added badge editing inside the workspace
- Added task priority and priority-based card color accents

## Task lifecycle

- Added starter tickets for new accounts
- Added archive support
- Added trash support with a 30-day delete window
- Added restore flow
- Added permanent delete from trash
- Added bulk archive, trash, restore, and delete actions in the workspace

## Board management

- Added search filtering
- Added date range filtering
- Added badge filtering
- Added priority filtering
- Added saved filter presets per user
- Added compact card mode
- Added per-user saved board UI preferences
- Added mobile stage tabs for smaller screens
- Added the `More` workspace for tickets, archive, trash, and badge management
- Added a resizable overlay inspector for ticket details
- Added empty-stage deletion with confirmation
- Added a persisted stage reorder route

## UI polish

- Removed the redundant `Private` header label
- Made header actions clearer, including a destructive sign-out button
- Widened board columns and tightened top spacing for better working space
- Improved task card spacing and drag handle clarity
- Made tooltips wider and viewport-aware so they stay readable near screen edges
- Cleaned the empty-board and inspector presentation for a sharper layout
- Normalized card content top spacing and reused shared content spacing classes across panels
- Removed JSX inline styles from the board shell and badge UI paths

## Accessibility and config

- Added accessible names to filter, preset, task, and workspace form controls
- Removed deprecated `aria-grabbed` usage from task cards
- Enabled `strict` and `forceConsistentCasingInFileNames` in the root TypeScript config

## Delivery bonus work

- Added an optional reminder sweep service and `npm run reminders`
- Added Playwright browser coverage for the drag/archive/trash/restore flow
- Expanded Playwright coverage to include stage reordering

## Structure

- Kept client component files in kebab-case
- Moved drag state and payload handling into `src/client/hooks/use-board-drag.ts`
- Added `use-category-drag.ts`, `use-drag-scroll.ts`, and `use-resizable-panel.ts`
- Added `use-board-ui-preferences.ts` for saved layout preferences
- Added `color-style.ts` and `drag-preview.ts` for reusable UI behavior
- Added `task-keyboard-move.ts` for keyboard movement logic
- Kept badge rendering in `task-badge-list.tsx`

## Verification

- Updated API tests for starter data, badge repo, presets, lifecycle actions, and stage reordering
- Updated client tests for the revised drag helpers, keyboard helper, and ticket card shape
- Added reminder service tests
- Added Playwright end-to-end coverage

