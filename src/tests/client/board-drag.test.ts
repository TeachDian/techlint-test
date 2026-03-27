import { describe, expect, it } from "vitest";
import { createDragPayload, resolveDropIndex } from "@client/hooks/use-board-drag";

describe("board drag helpers", () => {
  it("keeps the payload shape stable", () => {
    expect(createDragPayload("task-1", "category-1", 2)).toEqual({
      taskId: "task-1",
      categoryId: "category-1",
      index: 2,
    });
  });

  it("adjusts the target index when a task moves forward inside the same column", () => {
    expect(resolveDropIndex({ taskId: "task-1", categoryId: "category-1", index: 1 }, "category-1", 3)).toBe(2);
  });

  it("keeps the drop index when the task moves to a new column", () => {
    expect(resolveDropIndex({ taskId: "task-1", categoryId: "category-1", index: 1 }, "category-2", 3)).toBe(3);
  });
});
