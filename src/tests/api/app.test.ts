// @vitest-environment node

import path from "node:path";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../server/app.js";
import { deleteDatabaseFile } from "../../server/db/database.js";

describe("To-Do board API", () => {
  let databasePath = "";
  let closeDatabase = () => {};
  let app: ReturnType<typeof createApp>["app"];

  beforeEach(() => {
    databasePath = path.resolve(process.cwd(), `todo-board.test.${randomUUID()}.sqlite`);
    const appInstance = createApp({ databasePath });
    app = appInstance.app;
    closeDatabase = appInstance.close;
  });

  afterEach(() => {
    closeDatabase();
    deleteDatabaseFile(databasePath);
  });

  it("registers a user and seeds the default categories", async () => {
    const agent = request.agent(app);

    const registerResponse = await agent.post("/api/auth/register").send({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.email).toBe("alice@example.com");

    const boardResponse = await agent.get("/api/board");

    expect(boardResponse.status).toBe(200);
    expect(boardResponse.body.board.categories.map((category: { name: string }) => category.name)).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
    expect(boardResponse.body.board.tasks).toHaveLength(0);
    expect(boardResponse.body.board.comments).toHaveLength(0);
  });

  it("keeps tasks private per account, saves draft changes, tracks moves, and stores task comments", async () => {
    const owner = request.agent(app);
    const guest = request.agent(app);

    await owner.post("/api/auth/register").send({
      name: "Owner",
      email: "owner@example.com",
      password: "password123",
    });

    const ownerBoard = await owner.get("/api/board");
    const todoCategoryId = ownerBoard.body.board.categories[0].id;
    const doneCategoryId = ownerBoard.body.board.categories[2].id;

    const createTaskResponse = await owner.post("/api/board/tasks").send({
      categoryId: todoCategoryId,
      title: "Prepare release notes",
      description: "First draft",
      expiryAt: "2026-04-10T09:00:00.000Z",
    });

    expect(createTaskResponse.status).toBe(201);
    const createdTask = createTaskResponse.body.board.tasks[0];
    expect(createdTask.draftSavedAt).toBeTruthy();

    const updateTaskResponse = await owner.patch(`/api/board/tasks/${createdTask.id}`).send({
      title: "Prepare release notes",
      description: "Final draft with customer notes",
      expiryAt: "2026-04-12T09:00:00.000Z",
    });

    expect(updateTaskResponse.status).toBe(200);
    expect(updateTaskResponse.body.board.tasks[0].description).toBe("Final draft with customer notes");

    const createCommentResponse = await owner.post(`/api/board/tasks/${createdTask.id}/comments`).send({
      body: "Need approval from the product owner.",
    });

    expect(createCommentResponse.status).toBe(201);
    expect(createCommentResponse.body.board.comments[0].body).toBe("Need approval from the product owner.");

    const moveTaskResponse = await owner.post(`/api/board/tasks/${createdTask.id}/move`).send({
      categoryId: doneCategoryId,
      position: 0,
    });

    expect(moveTaskResponse.status).toBe(200);
    expect(moveTaskResponse.body.board.tasks[0].categoryId).toBe(doneCategoryId);
    expect(moveTaskResponse.body.board.history.some((item: { action: string }) => item.action === "moved")).toBe(true);
    expect(moveTaskResponse.body.board.history.some((item: { action: string }) => item.action === "commented")).toBe(true);

    await guest.post("/api/auth/register").send({
      name: "Guest",
      email: "guest@example.com",
      password: "password123",
    });

    const guestBoard = await guest.get("/api/board");
    expect(guestBoard.status).toBe(200);
    expect(guestBoard.body.board.tasks).toHaveLength(0);
    expect(guestBoard.body.board.history).toHaveLength(0);
    expect(guestBoard.body.board.comments).toHaveLength(0);
  });
});
