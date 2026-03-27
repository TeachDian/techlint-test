# Case Study

## Problem

The task was to build a Trello-style To-Do Board with authentication, categories, tickets, drag and drop, expiry awareness, draft saving, and a clean development process.

## Approach

I built a full-stack TypeScript app with React on the frontend and Express on the backend. Instead of MySQL, I used SQLite to keep setup simple and friendly for local development. Every main record is linked to a user so the board stays private per account.

## Key decisions

- Use secure cookie sessions instead of storing auth tokens in local storage
- Use SQLite to reduce setup cost
- Keep frontend state in focused contexts
- Use the HTML Drag and Drop API directly to satisfy the brief
- Add task history so movement can be reviewed later
- Add automated tests for the critical flows

## Result

The final solution covers the core practical-test requirements and the main bonus items.

- Register and login
- Private board data per user
- Custom categories
- Task creation and editing
- Draft autosave
- Expiry warnings
- Drag-and-drop movement without a drag-and-drop library
- Task movement history
- Tests and documentation

## What I would improve next

- Add email notifications for expiry alerts
- Add delete and archive flows
- Add role-based team boards
- Add E2E browser tests
- Replace the experimental SQLite runtime if stricter production stability is needed
