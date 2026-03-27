# Case Study

## What I built

I built a multi-user To-Do Board that matches the main brief and adds a few quality-of-life features without drifting too far away from the original task.

The final app covers:

- registration and sign-in
- private board data per user
- stage creation and reordering
- task creation and editing
- draft autosave
- expiry states and notifications
- native drag and drop without a third-party board library
- task comments and task history
- archive and trash flows
- reusable badges and saved filter presets

## Why I made a few specific choices

### SQLite instead of MySQL

The brief recommended MySQL, but I used SQLite because it is still relational and much easier to run for a take-home project. That made local setup, test setup, and Docker setup much lighter.

### Cookie sessions instead of token storage in the browser

I wanted authentication to stay simple and safer by default, so I used HTTP-only cookie sessions instead of putting auth tokens in local storage.

### Native drag and drop

The brief explicitly asked for drag and drop without a library, so I used the HTML Drag and Drop API directly and split the logic into small hooks.

### Separate workspace for archive and trash

I kept the main board focused on active work. Archive, trash, bulk actions, and badge management live under `More` so the board itself stays cleaner.

## What I would improve next

If I had one more pass after submission, I would do these next:

- add a visible shortcut legend for keyboard movement
- add more Playwright coverage for filters and badge editing
- add a real email provider behind the reminder service
- add progress feedback for large bulk actions

## Final note

The main goal of this project was not just to make the features work. I also wanted the codebase to stay readable, modular, and easy to explain in a review.
