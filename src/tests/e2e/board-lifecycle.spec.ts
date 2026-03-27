import { expect, test } from "@playwright/test";

test("dragging stages and tickets through the board lifecycle works", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await page.goto("/");
  await page.getByLabel("Name").fill("E2E User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("heading", { name: "Task board" })).toBeVisible();

  await page.getByRole("button", { name: "Reorder stage In Progress" }).dragTo(page.locator('[data-testid^="board-column-frame-"]').first(), { targetPosition: { x: 18, y: 48 } });
  await expect(page.locator('[data-testid^="board-column-"]').first()).toContainText("In Progress");

  const sourceCard = page.locator('[data-testid^="task-card-"]', { hasText: "Review homepage copy" }).first();
  const targetCard = page.locator('[data-testid^="task-card-"]', { hasText: "Refine board drag feedback" }).first();

  await sourceCard.dragTo(targetCard);
  await expect(page.getByText("Task swapped")).toBeVisible();

  await page.getByRole("button", { name: "Compact view" }).click();
  await expect(page.getByRole("button", { name: "Compact view" })).toBeVisible();

  await page.getByRole("button", { name: "More" }).click();

  const activeRow = page.locator('[data-testid^="workspace-task-"]', { hasText: "Review homepage copy" }).first();
  await activeRow.getByRole("button", { name: "Archive" }).click();
  await page.getByTestId("confirmation-confirm").click();

  await page.getByRole("button", { name: "Archive" }).first().click();
  const archivedRow = page.locator('[data-testid^="workspace-task-"]', { hasText: "Review homepage copy" }).first();
  await expect(archivedRow).toBeVisible();
  await archivedRow.getByRole("button", { name: "Move to trash" }).click();
  await page.getByTestId("confirmation-confirm").click();

  await page.getByRole("button", { name: "Trash" }).first().click();
  const trashedRow = page.locator('[data-testid^="workspace-task-"]', { hasText: "Review homepage copy" }).first();
  await expect(trashedRow).toBeVisible();
  await trashedRow.getByRole("button", { name: "Restore" }).click();
  await page.getByTestId("confirmation-confirm").click();

  await page.getByRole("button", { name: "Tickets" }).first().click();
  await expect(page.locator('[data-testid^="workspace-task-"]', { hasText: "Review homepage copy" }).first()).toBeVisible();
});


