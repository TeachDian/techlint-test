import { describe, expect, it } from "vitest";
import { getKeyboardMovePayload } from "@client/lib/task-keyboard-move";

describe("task keyboard move helper", () => {
  const categories = [
    { id: "todo", name: "To Do", position: 0, taskCount: 2 },
    { id: "doing", name: "In Progress", position: 1, taskCount: 1 },
  ];

  const tasksByCategory = new Map([
    [
      "todo",
      [
        {
          id: "task-1",
          categoryId: "todo",
          title: "One",
          description: "",
          expiryAt: null,
          position: 0,
          priority: null,
          createdAt: "2026-03-27T08:00:00.000Z",
          updatedAt: "2026-03-27T08:00:00.000Z",
          draftSavedAt: null,
          archivedAt: null,
          trashedAt: null,
          deleteAfterAt: null,
        },
        {
          id: "task-2",
          categoryId: "todo",
          title: "Two",
          description: "",
          expiryAt: null,
          position: 1,
          priority: null,
          createdAt: "2026-03-27T08:00:00.000Z",
          updatedAt: "2026-03-27T08:00:00.000Z",
          draftSavedAt: null,
          archivedAt: null,
          trashedAt: null,
          deleteAfterAt: null,
        },
      ],
    ],
    [
      "doing",
      [
        {
          id: "task-3",
          categoryId: "doing",
          title: "Three",
          description: "",
          expiryAt: null,
          position: 0,
          priority: null,
          createdAt: "2026-03-27T08:00:00.000Z",
          updatedAt: "2026-03-27T08:00:00.000Z",
          draftSavedAt: null,
          archivedAt: null,
          trashedAt: null,
          deleteAfterAt: null,
        },
      ],
    ],
  ]);

  it("moves a task down inside the same column", () => {
    expect(getKeyboardMovePayload("task-1", "down", categories, tasksByCategory)).toEqual({
      categoryId: "todo",
      position: 1,
    });
  });

  it("moves a task into the next column", () => {
    expect(getKeyboardMovePayload("task-2", "right", categories, tasksByCategory)).toEqual({
      categoryId: "doing",
      position: 1,
    });
  });

  it("returns null when the move is not possible", () => {
    expect(getKeyboardMovePayload("task-1", "up", categories, tasksByCategory)).toBeNull();
    expect(getKeyboardMovePayload("task-3", "right", categories, tasksByCategory)).toBeNull();
  });
});
