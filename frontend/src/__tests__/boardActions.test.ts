import { describe, it, expect } from "vitest";
import { initialBoard } from "@/lib/initialData";
import {
  renameColumn,
  addCard,
  deleteCard,
  moveCard,
  findColumnByCardId,
} from "@/lib/boardActions";

describe("boardActions", () => {
  it("initial board has 5 columns with cards", () => {
    expect(initialBoard.columns).toHaveLength(5);
    const totalCards = initialBoard.columns.reduce(
      (sum, col) => sum + col.cardIds.length,
      0
    );
    expect(totalCards).toBeGreaterThan(0);
  });

  it("renameColumn updates column title", () => {
    const result = renameColumn(initialBoard, "col-backlog", "Ideas");
    expect(result.columns.find((c) => c.id === "col-backlog")?.title).toBe(
      "Ideas"
    );
  });

  it("renameColumn trims whitespace", () => {
    const result = renameColumn(initialBoard, "col-todo", "  Ready  ");
    expect(result.columns.find((c) => c.id === "col-todo")?.title).toBe("Ready");
  });

  it("addCard adds card to column", () => {
    const result = addCard(initialBoard, "col-todo", {
      title: "New task",
      details: "Some details",
    });
    const column = result.columns.find((c) => c.id === "col-todo");
    expect(column?.cardIds).toHaveLength(3);
    const newId = column!.cardIds[2];
    expect(result.cards[newId]).toEqual({
      id: newId,
      title: "New task",
      details: "Some details",
    });
  });

  it("addCard rejects empty title", () => {
    const result = addCard(initialBoard, "col-todo", {
      title: "   ",
      details: "Details",
    });
    expect(result).toEqual(initialBoard);
  });

  it("deleteCard removes card from board and column", () => {
    const result = deleteCard(initialBoard, "card-4");
    expect(result.cards["card-4"]).toBeUndefined();
    const column = result.columns.find((c) => c.id === "col-todo");
    expect(column?.cardIds).not.toContain("card-4");
  });

  it("moveCard moves card across columns", () => {
    const result = moveCard(initialBoard, {
      cardId: "card-1",
      fromColumnId: "col-backlog",
      toColumnId: "col-done",
      toIndex: 0,
    });
    expect(
      result.columns.find((c) => c.id === "col-backlog")?.cardIds
    ).not.toContain("card-1");
    expect(
      result.columns.find((c) => c.id === "col-done")?.cardIds[0]
    ).toBe("card-1");
  });

  it("moveCard reorders within same column", () => {
    const result = moveCard(initialBoard, {
      cardId: "card-1",
      fromColumnId: "col-backlog",
      toColumnId: "col-backlog",
      toIndex: 2,
    });
    const cardIds = result.columns.find((c) => c.id === "col-backlog")?.cardIds;
    expect(cardIds).toEqual(["card-2", "card-3", "card-1"]);
  });

  it("findColumnByCardId returns correct column", () => {
    expect(findColumnByCardId(initialBoard, "card-6")).toBe("col-inprogress");
    expect(findColumnByCardId(initialBoard, "missing")).toBeNull();
  });
});
