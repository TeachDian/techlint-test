# Git Stages

The test asked for a repo that shows real progress, not one big final dump.

The repo already follows that pattern. The current history is grouped into practical steps instead of one large commit.

## Current commit trail

```text
feat: rebuild todo board with sharp full-screen UI and native drag-and-drop
refactor: sharpen board UI, split drag logic, and add task comments
feat: add filter presets, bulk workspace actions, keyboard moves, and e2e coverage
feat: ux and ui improvements
feat: polish board ux, drag behavior, and submission docs
```

## If I were pushing this from scratch again

I would keep the same rough order:

1. Project setup and auth
2. Basic board and task flows
3. Drag and drop improvements
4. Workspace, filters, and quality-of-life work
5. Tests, docs, and Docker

## Branch suggestion

```bash
git checkout -b feature/techlint-todo-board
```

## Push habit that worked well here

- make a commit when one chunk is stable
- run `npm run check`, `npm test`, and `npm run build`
- push after that, not before
- keep commit messages short and specific
