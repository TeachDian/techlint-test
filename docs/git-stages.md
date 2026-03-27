# Git Stages

The practical test asked for a repository that shows the development process. A good way to do that is to push in small stages.

## Suggested branch

Use a feature branch like this:

```bash
git checkout -b feature/techlint-todo-board
```

## Suggested stage order

### Stage 1

Goal: project setup

Suggested commit message:

```text
chore: scaffold React, Tailwind, Express, and SQLite project
```

### Stage 2

Goal: backend auth and database

Suggested commit message:

```text
feat: add session auth and SQLite board data model
```

### Stage 3

Goal: board UI and task flows

Suggested commit message:

```text
feat: add native drag board, task editor, and expiry alerts
```

### Stage 4

Goal: UI refactor and quality-of-life improvements

Suggested commit message:

```text
refactor: sharpen board UI, split drag logic, and add task comments
```

### Stage 5

Goal: tests and documentation

Suggested commit message:

```text
test: add automated coverage and update project documentation
```

## Suggested push flow

```bash
git add .
git commit -m "chore: scaffold React, Tailwind, Express, and SQLite project"
git push -u origin feature/techlint-todo-board
```

Repeat the same pattern for each stage.

## Best practice notes

- Keep commit messages short and clear
- Push after each stable milestone
- Avoid one huge final commit
- Run `npm test` and `npm run build` before each push
