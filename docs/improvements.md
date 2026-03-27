# Improvements Log

This file tracks the main quality-of-life improvements added after the first working version.

## Board interaction

- Fixed the top drop zone so tasks can be inserted at the first position of a populated column
- Added card-level drag targets for `before`, `after`, and `swap`
- Added horizontal drag-scroll for the full board surface
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
- Added the `More` workspace for tickets, archive, trash, and badge management
- Added a resizable overlay inspector for ticket details

## Delivery bonus work

- Added an optional reminder sweep service and `npm run reminders`
- Added Playwright browser coverage for the drag/archive/trash/restore flow

## Structure

- Kept client component files in kebab-case
- Moved drag state and payload handling into `src/client/hooks/use-board-drag.ts`
- Added `use-drag-scroll.ts` and `use-resizable-panel.ts`
- Added `task-keyboard-move.ts` for keyboard movement logic
- Kept badge rendering in `task-badge-list.tsx`

## Verification

- Updated API tests for starter data, badge repo, presets, and lifecycle actions
- Updated client tests for the revised drag helpers, keyboard helper, and ticket card shape
- Added reminder service tests
- Added Playwright end-to-end coverage
