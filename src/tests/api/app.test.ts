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

  it("registers a user and seeds categories, starter tasks, and badge definitions", async () => {
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
    expect(boardResponse.body.board.categories.map((category: { name: string }) => category.name)).toEqual(["To Do", "In Progress", "Done"]);
    expect(boardResponse.body.board.tasks.length).toBeGreaterThanOrEqual(3);
    expect(boardResponse.body.board.badgeDefinitions.length).toBeGreaterThanOrEqual(4);
    expect(boardResponse.body.board.taskBadges.length).toBeGreaterThan(0);
    expect(boardResponse.body.board.filterPresets).toEqual([]);
  });

  it("keeps board data private per account and supports presets, badge updates, comments, moves, archive, trash, restore, and empty category deletion", async () => {
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
    const starterBadgeId = ownerBoard.body.board.badgeDefinitions[0].id;

    const createCategoryResponse = await owner.post("/api/board/categories").send({
      name: "Blocked",
    });

    expect(createCategoryResponse.status).toBe(201);
    const emptyCategory = createCategoryResponse.body.board.categories.find((category: { name: string }) => category.name === "Blocked");
    expect(emptyCategory).toBeTruthy();

    const deleteNonEmptyCategoryResponse = await owner.delete(`/api/board/categories/${todoCategoryId}`).send();
    expect(deleteNonEmptyCategoryResponse.status).toBe(400);

    const deleteEmptyCategoryResponse = await owner.delete(`/api/board/categories/${emptyCategory.id}`).send();
    expect(deleteEmptyCategoryResponse.status).toBe(200);
    expect(deleteEmptyCategoryResponse.body.board.categories.some((category: { id: string }) => category.id === emptyCategory.id)).toBe(false);

    const createTaskResponse = await owner.post("/api/board/tasks").send({
      categoryId: todoCategoryId,
      title: "Prepare release notes",
      description: "First draft",
      expiryAt: "2026-04-10T09:00:00.000Z",
      priority: "high",
      badgeIds: [starterBadgeId],
    });

    expect(createTaskResponse.status).toBe(201);
    const createdTask = createTaskResponse.body.board.tasks.find((task: { title: string }) => task.title === "Prepare release notes");
    expect(createdTask.draftSavedAt).toBeTruthy();
    expect(createdTask.priority).toBe("high");

    const updateTaskResponse = await owner.patch(`/api/board/tasks/${createdTask.id}`).send({
      title: "Prepare release notes",
      description: "Final draft with customer notes",
      expiryAt: "2026-04-12T09:00:00.000Z",
      priority: "urgent",
      badgeIds: [starterBadgeId],
    });

    expect(updateTaskResponse.status).toBe(200);
    expect(updateTaskResponse.body.board.tasks.find((task: { id: string }) => task.id === createdTask.id).description).toBe("Final draft with customer notes");

    const createCommentResponse = await owner.post(`/api/board/tasks/${createdTask.id}/comments`).send({
      body: "Need approval from the product owner.",
    });

    expect(createCommentResponse.status).toBe(201);
    expect(createCommentResponse.body.board.comments.some((comment: { taskId: string; body: string }) => comment.taskId === createdTask.id && comment.body.includes("product owner"))).toBe(true);

    const moveTaskResponse = await owner.post(`/api/board/tasks/${createdTask.id}/move`).send({
      categoryId: doneCategoryId,
      position: 0,
    });

    expect(moveTaskResponse.status).toBe(200);
    expect(moveTaskResponse.body.board.tasks.find((task: { id: string }) => task.id === createdTask.id).categoryId).toBe(doneCategoryId);

    const createBadgeResponse = await owner.post("/api/board/badges").send({
      title: "Release",
      description: "Release work",
      color: "#0f766e",
    });

    expect(createBadgeResponse.status).toBe(201);
    const createdBadge = createBadgeResponse.body.board.badgeDefinitions.find((badge: { title: string }) => badge.title === "Release");
    expect(createdBadge).toBeTruthy();

    const updateBadgeResponse = await owner.patch(`/api/board/badges/${createdBadge.id}`).send({
      title: "Release Blocked",
      description: "Waiting on the release window",
      color: "#b91c1c",
    });

    expect(updateBadgeResponse.status).toBe(200);
    expect(updateBadgeResponse.body.board.badgeDefinitions.find((badge: { id: string }) => badge.id === createdBadge.id).title).toBe("Release Blocked");

    const createPresetResponse = await owner.post("/api/board/filter-presets").send({
      name: "Urgent release",
      query: "release",
      priority: "urgent",
      badgeId: starterBadgeId,
      startDate: "2026-04-01",
      endDate: "2026-04-30",
    });

    expect(createPresetResponse.status).toBe(201);
    const createdPreset = createPresetResponse.body.board.filterPresets.find((preset: { name: string }) => preset.name === "Urgent release");
    expect(createdPreset).toBeTruthy();

    const updatePresetResponse = await owner.patch(`/api/board/filter-presets/${createdPreset.id}`).send({
      name: "Urgent release updated",
      query: "customer",
      priority: "high",
      badgeId: starterBadgeId,
      startDate: "2026-04-05",
      endDate: "2026-04-25",
    });

    expect(updatePresetResponse.status).toBe(200);
    expect(updatePresetResponse.body.board.filterPresets.find((preset: { id: string }) => preset.id === createdPreset.id).name).toBe("Urgent release updated");

    const archiveTaskResponse = await owner.post(`/api/board/tasks/${createdTask.id}/archive`).send();
    expect(archiveTaskResponse.status).toBe(200);
    expect(archiveTaskResponse.body.board.tasks.find((task: { id: string }) => task.id === createdTask.id).archivedAt).toBeTruthy();

    const trashTaskResponse = await owner.post(`/api/board/tasks/${createdTask.id}/trash`).send();
    expect(trashTaskResponse.status).toBe(200);
    expect(trashTaskResponse.body.board.tasks.find((task: { id: string }) => task.id === createdTask.id).trashedAt).toBeTruthy();

    const restoreTaskResponse = await owner.post(`/api/board/tasks/${createdTask.id}/restore`).send();
    expect(restoreTaskResponse.status).toBe(200);
    expect(restoreTaskResponse.body.board.tasks.find((task: { id: string }) => task.id === createdTask.id).trashedAt).toBeNull();

    const deletePresetResponse = await owner.delete(`/api/board/filter-presets/${createdPreset.id}`).send();
    expect(deletePresetResponse.status).toBe(200);
    expect(deletePresetResponse.body.board.filterPresets.some((preset: { id: string }) => preset.id === createdPreset.id)).toBe(false);

    const deleteBadgeResponse = await owner.delete(`/api/board/badges/${createdBadge.id}`).send();
    expect(deleteBadgeResponse.status).toBe(200);
    expect(deleteBadgeResponse.body.board.badgeDefinitions.some((badge: { id: string }) => badge.id === createdBadge.id)).toBe(false);

    await guest.post("/api/auth/register").send({
      name: "Guest",
      email: "guest@example.com",
      password: "password123",
    });

    const guestBoard = await guest.get("/api/board");
    expect(guestBoard.status).toBe(200);
    expect(guestBoard.body.board.tasks.some((task: { title: string }) => task.title === "Prepare release notes")).toBe(false);
    expect(guestBoard.body.board.comments.some((comment: { body: string }) => comment.body.includes("product owner"))).toBe(false);
    expect(guestBoard.body.board.badgeDefinitions.some((badge: { title: string }) => badge.title === "Release Blocked")).toBe(false);
    expect(guestBoard.body.board.filterPresets.length).toBe(0);
  });
});
