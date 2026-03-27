# Docker Guide

I added Docker as an optional way to run the project without setting up Node locally.

## What the Docker setup does

- Builds the frontend and backend in one image
- Runs the production Express server
- Serves the frontend and API from the same container
- Stores SQLite data in a Docker volume

## Start it

```bash
docker compose up --build
```

Open the app at `http://localhost:3001`.

## Stop it

```bash
docker compose down
```

## Useful commands

Rebuild after a code change:

```bash
docker compose up --build
```

Run the reminder sweep inside the container:

```bash
docker compose exec app npm run reminders:prod
```

Open a shell in the container:

```bash
docker compose exec app sh
```

## Data location

The SQLite database and reminder log are stored in the Docker volume `todo-board-data`.

That means your data stays there even if the container stops.

## Docker environment values

The compose file sets these values:

- `PORT=3001`
- `NODE_ENV=production`
- `DATABASE_PATH=/app/data/todo-board.sqlite`
- `REMINDER_TRANSPORT=file`
- `REMINDER_OUTPUT_PATH=/app/data/task-reminders.log`
- `REMINDER_LOOKAHEAD_HOURS=48`
- `REMINDER_CHANNEL=email`

## Notes

- Docker is optional. The normal local setup is still the main path for development.
- I did not split the app into separate frontend and backend containers because this project does not need that extra complexity.
