# Case Study

## Problem

The task was to build a To-Do Board with authentication, categories, tickets, drag and drop, expiry awareness, draft saving, and a clean development process.

## Approach

I built a full-stack TypeScript app with React on the frontend and Express on the backend. Instead of MySQL, I used SQLite to keep setup simple and friendly for local development. Every main record is linked to a user so the board stays private per account.

## Key decisions

- Use secure cookie sessions instead of storing auth tokens in local storage
- Use SQLite to reduce setup cost
- Keep frontend state in focused contexts
- Use the HTML Drag and Drop API directly to satisfy the brief
- Split drag logic into its own module for reuse and easier testing
- Add task comments and activity history to improve day-to-day use
- Keep component file names in kebab-case for a cleaner structure
- Add automated tests for the critical flows

## Result

The final solution covers the core practical-test requirements and several quality-of-life improvements.

- Register and login
- Private board data per user
- Custom categories
- Task creation and editing
- Draft autosave
- Task comments
- Expiry warnings
- Drag-and-drop movement without a drag-and-drop library
- Task movement history
- Responsive board layout with focus mode and browser full screen
- Tests and documentation

## What I would improve next

- Add edit and delete for comments
- Add delete and archive flows for tasks
- Add E2E browser tests
- Add accessibility checks for keyboard-only board movement
- Replace the experimental SQLite runtime if stricter production stability is needed
