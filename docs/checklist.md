# Project Checklist

Use this file to track the current build state.

## Core build

- [x] Set up React, Tailwind CSS, Express, and SQLite
- [x] Add secure session authentication
- [x] Keep board data private per account
- [x] Seed starter categories, starter badges, and starter tickets

## Task board

- [x] Create categories
- [x] Reorder categories
- [x] Create tasks inside categories
- [x] Edit task title, description, and expiry date
- [x] Autosave task drafts
- [x] Add task comments
- [x] Add task badges
- [x] Add task priority
- [x] Show due soon and overdue alerts
- [x] Track task movement history

## Drag and drop

- [x] Use the HTML Drag and Drop API
- [x] Avoid third-party drag-and-drop libraries
- [x] Support reordering inside the same category
- [x] Support moving tasks between categories
- [x] Support swap-on-drop over another ticket
- [x] Support insert-at-top in populated columns
- [x] Support stage reordering
- [x] Separate drag logic into its own client module
- [x] Add keyboard-first task movement
- [x] Add pointer-based drag-scroll for the board surface
- [x] Add stronger drag previews and drop feedback
- [x] Make task and stage drops more forgiving with wider hit targets

## Board management

- [x] Add search filtering
- [x] Add date range filtering
- [x] Add badge filtering
- [x] Add priority filtering
- [x] Add saved filter presets
- [x] Add archive flow
- [x] Add trash flow with 30-day retention
- [x] Add restore flow
- [x] Add permanent delete from trash
- [x] Add the `More` workspace view
- [x] Add bulk workspace actions
- [x] Delete empty stages with confirmation
- [x] Save board UI preferences per user

## UI and UX

- [x] Keep the board full screen
- [x] Add focus mode
- [x] Add browser full screen mode
- [x] Add tooltip support
- [x] Keep tooltips inside the viewport
- [x] Add a resizable details inspector
- [x] Add drag-scroll for the board surface
- [x] Keep far-right stages reachable while the inspector is open
- [x] Keep the UI sharp and square-edged
- [x] Make the board responsive
- [x] Add mobile stage tabs
- [x] Add compact card mode
- [x] Add badge editing in the workspace
- [x] Keep header actions visibly button-like
- [x] Remove redundant header labels
- [x] Keep shared card and panel spacing consistent

## Accessibility and config

- [x] Label filter and task form controls
- [x] Label workspace task selection controls
- [x] Remove deprecated drag ARIA usage
- [x] Remove JSX inline styles from the flagged board UI paths
- [x] Enable strict root TypeScript config checks

## Code quality

- [x] Use reusable UI primitives
- [x] Keep client component file names in kebab-case
- [x] Keep board logic modular
- [x] Keep setup and usage instructions in simple English
- [x] Add an optional reminder service module

## Verification

- [x] TypeScript checks
- [x] Automated API tests
- [x] Automated client tests
- [x] Playwright end-to-end tests
- [x] Production build

## Optional next steps

- [ ] Add keyboard help tooltip or shortcut legend
- [ ] Add bulk action progress feedback for very large boards
- [ ] Add a real email transport provider on top of the reminder service
- [ ] Add more Playwright scenarios for filter presets and badge editing

