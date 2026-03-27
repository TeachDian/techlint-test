# Improvements Log

This file tracks the main quality-of-life improvements added after the first working version.

## UI and layout

- Reworked the board into a sharper, square-edge visual system
- Removed noisy marketing-style copy from the main board screen
- Added a responsive layout where the details area stacks under the board on smaller screens
- Added focus mode and browser full screen for wider drag-and-drop space
- Added tooltip support for deadline details

## Modularity and naming

- Renamed client component files to kebab-case
- Moved drag state and payload handling into `src/client/hooks/use-board-drag.ts`
- Kept board data helpers in `src/client/lib/board.ts`
- Added `task-comments-panel.tsx` to keep task comment logic out of the main editor body

## Task workflow

- Added per-task comments
- Added comment count on task cards
- Added clearer drop zones with a visible `Drop here` state while dragging
- Kept task history and comment history separate so each view stays easier to read

## Backend and storage

- Added the `task_comments` SQLite table
- Added the `POST /api/board/tasks/:taskId/comments` API route
- Added cleanup for SQLite `-wal` and `-shm` files during tests

## Testing and docs

- Added API coverage for task comments
- Added client coverage for the extracted drag helpers
- Added a checklist document to track work items
- Updated the setup, architecture, API, testing, and case study docs
