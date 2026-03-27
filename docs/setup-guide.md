# Setup Guide

This guide uses simple English and short steps.

## 1. Install Node.js

Use Node.js 22 or newer.

Check your version:

```bash
node -v
npm -v
```

## 2. Install the project packages

```bash
npm install
```

If PowerShell blocks `npm.ps1`, use this instead:

```bash
cmd /c npm install
```

## 3. Optional environment setup

Copy `.env.example` to `.env` if you want to change the defaults.

Default values:

- `PORT=3001`
- `DATABASE_PATH=todo-board.sqlite`
- `NODE_ENV=development`

## 4. Run the app in development mode

```bash
npm run dev
```

This starts:

- Frontend on `http://localhost:5173`
- API on `http://localhost:3001`

## 5. Open the app

Open `http://localhost:5173` in your browser.

## 6. Basic usage

- Register an account
- Create or keep your categories
- Add tasks and due dates
- Drag tasks across the board
- Select a task to edit details and add comments
- Use `Focus board` or `Full screen` when you want more board space

## 7. Build for production

```bash
npm run build
npm start
```

## 8. Run the tests

```bash
npm test
```

## Common notes

- The SQLite file is created automatically.
- Each account gets its own data.
- Node may show an experimental warning for `node:sqlite`. This is expected on Node 22.
- On smaller screens, the details area moves below the board.
