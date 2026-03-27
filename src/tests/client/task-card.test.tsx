import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskCard } from "@client/components/task-card";

describe("TaskCard", () => {
  it("shows task content, status badge, and comment count", () => {
    render(
      <TaskCard
        badges={[]}
        commentCount={2}
        dropTarget={null}
        index={0}
        isDragging={false}
        isSelected={false}
        onDragEnd={() => {}}
        onDragStart={() => {}}
        onDropPreview={() => {}}
        onDropTask={() => {}}
        onKeyboardMove={() => {}}
        onSelect={() => {}}
        task={{
          id: "task-1",
          categoryId: "category-1",
          title: "Write docs",
          description: "Update the setup and usage guide.",
          expiryAt: "2026-03-28T08:00:00.000Z",
          position: 0,
          priority: "high",
          createdAt: "2026-03-27T08:00:00.000Z",
          updatedAt: "2026-03-27T08:00:00.000Z",
          draftSavedAt: "2026-03-27T08:30:00.000Z",
          archivedAt: null,
          trashedAt: null,
          deleteAfterAt: null,
        }}
      />,
    );

    const card = screen.getByRole("button", { name: /Write docs/i });

    expect(card).toHaveAttribute("aria-keyshortcuts", "Alt+Shift+ArrowUp Alt+Shift+ArrowDown Alt+Shift+ArrowLeft Alt+Shift+ArrowRight");
    expect(screen.getByText("Write docs")).toBeInTheDocument();
    expect(screen.getByText(/Update the setup and usage guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled|Due soon|Overdue|No deadline/i)).toBeInTheDocument();
    expect(screen.getByText("2 comments")).toBeInTheDocument();
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();
  });
});
