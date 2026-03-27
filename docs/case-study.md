# Case Study

## Problem

The task was to build a To-Do Board with authentication, categories, tickets, drag and drop, expiry awareness, draft saving, and a clean development process.

## Approach

I built a full-stack TypeScript app with React on the frontend and Express on the backend. Instead of MySQL, I used SQLite to keep setup simple and friendly for local development. Every main record is linked to a user so the board stays private per account.

## Key decisions

- Use secure cookie sessions instead of storing auth tokens in local storage
- Use SQLite to reduce setup cost
- Use the HTML Drag and Drop API directly to satisfy the brief
- Extend drag behavior with top insert, after insert, and swap targets without introducing a drag library
- Add keyboard movement so the board is still efficient without the mouse
- Add starter data so the board is meaningful on first load
- Add a badge repository, badge editing, and task priority without moving too far away from the original ticketing brief
- Keep archive and trash inside a separate workspace so the main board stays focused
- Keep the details panel resizable and overlay-based instead of permanently shrinking the board
- Keep reminders local-first with a reusable service instead of forcing a third-party mail provider into the test project

## Result

The final solution covers the practical-test requirements and a set of quality-of-life improvements that still fit the original task closely.

- Register and login
- Private board data per user
- Custom categories
- Task creation and editing
- Draft autosave
- Task comments
- Badge repository, badge editing, and badge assignment
- Search, filters, and saved filter presets
- Priority-based card styling
- Drag-and-drop movement without a drag-and-drop library
- Keyboard task movement with shortcut support
- Archive and trash lifecycle with bulk actions
- Responsive board layout with a resizable details inspector
- Reminder sweep support for due soon and overdue tasks
- Unit, API, and Playwright test coverage
- Setup and architecture documentation

## What I would improve next

- Add a visible shortcut legend for the keyboard controls
- Add batch progress feedback for very large boards
- Plug the reminder service into a real email provider
- Add more Playwright scenarios for presets and badge editing
- Replace the experimental SQLite runtime if stricter production stability is needed
