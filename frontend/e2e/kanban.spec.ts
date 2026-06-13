import { test, expect, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/");
  const signIn = page.getByRole("button", { name: "Sign in" });
  if (await signIn.isVisible().catch(() => false)) {
    await signIn.click();
  }
  await expect(page.getByRole("heading", { name: "Kanban Board" })).toBeVisible();
}

test.describe("Kanban Board", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("logs in and loads the seeded board", async ({ page }) => {
    await expect(page.getByText("Backlog")).toBeVisible();
    await expect(page.getByText("To Do")).toBeVisible();
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();
  });

  test("renames a column and restores it", async ({ page }) => {
    await page.getByRole("button", { name: "Rename column: In Progress" }).click();
    const input = page.getByLabel("Column title");
    await input.fill("Building");
    await input.press("Enter");
    await expect(page.getByText("Building")).toBeVisible();

    await page.getByRole("button", { name: "Rename column: Building" }).click();
    const restore = page.getByLabel("Column title");
    await restore.fill("In Progress");
    await restore.press("Enter");
    await expect(page.getByText("In Progress")).toBeVisible();
  });

  test("adds then deletes a card", async ({ page }) => {
    const backlog = page.getByTestId("column-col-backlog");
    await backlog.getByRole("button", { name: "+ Add card" }).click();
    const title = backlog.getByLabel("Card title");
    await title.fill("E2E Test Card");
    await backlog.getByLabel("Card details").fill("Created by Playwright");
    await title.press("Enter");

    const card = page.locator(".group", { hasText: "E2E Test Card" });
    await expect(card).toBeVisible();

    await card.hover();
    await card.getByRole("button", { name: "Delete card: E2E Test Card" }).click();
    await expect(page.getByText("E2E Test Card")).not.toBeVisible();
  });

  test("drags a card to another column", async ({ page }) => {
    const todo = page.getByTestId("column-col-todo");
    await todo.getByRole("button", { name: "+ Add card" }).click();
    const title = todo.getByLabel("Card title");
    await title.fill("Draggable Card");
    await title.press("Enter");

    const card = page.getByText("Draggable Card");
    await expect(card).toBeVisible();
    const doneColumn = page.getByTestId("column-col-done");

    const cardBox = await card.boundingBox();
    const columnBox = await doneColumn.boundingBox();
    if (!cardBox || !columnBox) throw new Error("Could not find bounding boxes");

    const startX = cardBox.x + cardBox.width / 2;
    const startY = cardBox.y + cardBox.height / 2;
    const endX = columnBox.x + columnBox.width / 2;
    const endY = columnBox.y + columnBox.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 15, startY + 15);
    await page.mouse.move(endX, endY, { steps: 25 });
    await page.waitForTimeout(200);
    await page.mouse.up();

    await expect(doneColumn.getByText("Draggable Card")).toBeVisible();

    const movedCard = page.locator(".group", { hasText: "Draggable Card" });
    await movedCard.hover();
    await movedCard
      .getByRole("button", { name: "Delete card: Draggable Card" })
      .click();
    await expect(page.getByText("Draggable Card")).not.toBeVisible();
  });

  test("chats with the assistant", async ({ page }) => {
    await page.getByRole("button", { name: "Open assistant" }).click();
    await expect(page.getByRole("heading", { name: "Assistant" })).toBeVisible();
    await page.getByLabel("Chat message").fill("Say hi in 3 words");
    await page.getByRole("button", { name: "Send" }).click();

    await expect(
      page.locator(".bg-primary", { hasText: "Say hi in 3 words" })
    ).toBeVisible();
  });

  test("assistant performs a board action", async ({ page }) => {
    await page.getByRole("button", { name: "Open assistant" }).click();
    await page
      .getByLabel("Chat message")
      .fill('Add a card titled "AI Added Card" to the Backlog column');
    await page.getByRole("button", { name: "Send" }).click();

    const backlog = page.getByTestId("column-col-backlog");
    await expect(backlog.getByText("AI Added Card")).toBeVisible({
      timeout: 30000,
    });

    const card = page.locator(".group", { hasText: "AI Added Card" });
    await card.hover();
    await card.getByRole("button", { name: "Delete card: AI Added Card" }).click();
    await expect(backlog.getByText("AI Added Card")).not.toBeVisible();
  });
});
