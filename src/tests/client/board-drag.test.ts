import { describe, expect, it } from "vitest";
import { createDragPayload, createDropTarget, resolveDropIndex, resolveMovePayload } from "@client/hooks/use-board-drag";

describe("board drag helpers", () => {
  it("keeps the payload shape stable", () => {
    expect(createDragPayload("task-1", "category-1", 2)).toEqual({
      kind: "task",
      taskId: "task-1",
      categoryId: "category-1",
      index: 2,
    });
  });

  it("adjusts the target index when a task moves forward inside the same column", () => {
    expect(resolveDropIndex({ kind: "task", taskId: "task-1", categoryId: "category-1", index: 1 }, createDropTarget("category-1", 3, "before"))).toBe(2);
  });

  it("builds a swap move payload when a card is dropped on another card", () => {
    expect(resolveMovePayload({ kind: "task", taskId: "task-1", categoryId: "category-1", index: 1 }, createDropTarget("category-2", 0, "swap", "task-9"))).toEqual({
      categoryId: "category-2",
      position: 0,
      swapWithTaskId: "task-9",
    });
  });
});
