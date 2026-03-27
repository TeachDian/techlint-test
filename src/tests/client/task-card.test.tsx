import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TaskCard } from "@client/components/TaskCard";

describe("TaskCard", () => {
  it("shows task content and status badge", () => {
    render(
      <TaskCard
        index={0}
        isSelected={false}
        onDragEnd={() => {}}
        onDragStart={() => {}}
        onSelect={() => {}}
        task={{
          id: "task-1",
          categoryId: "category-1",
          title: "Write docs",
          description: "Update the setup and usage guide.",
          expiryAt: "2026-03-28T08:00:00.000Z",
          position: 0,
          createdAt: "2026-03-27T08:00:00.000Z",
          updatedAt: "2026-03-27T08:00:00.000Z",
          draftSavedAt: "2026-03-27T08:30:00.000Z",
        }}
      />,
    );

    expect(screen.getByText("Write docs")).toBeInTheDocument();
    expect(screen.getByText(/Update the setup and usage guide/i)).toBeInTheDocument();
    expect(screen.getByText(/Scheduled|Due soon|Overdue|No deadline/i)).toBeInTheDocument();
  });
});
