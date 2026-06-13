import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/context/AuthContext";
import { initialBoard } from "@/lib/initialData";
import type { Board as BoardType } from "@/lib/types";
import * as boardActions from "@/lib/boardActions";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getBoard: vi.fn(),
    renameColumn: vi.fn(),
    addCard: vi.fn(),
    deleteCard: vi.fn(),
    moveCard: vi.fn(),
  };
});

import * as api from "@/lib/api";
import { Board } from "@/components/Board";

function renderBoard() {
  return render(
    <AuthProvider>
      <Board />
    </AuthProvider>
  );
}

describe("Board", () => {
  let board: BoardType;

  beforeEach(() => {
    board = structuredClone(initialBoard);
    vi.mocked(api.getBoard).mockImplementation(async () => board);
    vi.mocked(api.renameColumn).mockImplementation(async (id, title) => {
      board = boardActions.renameColumn(board, id, title);
      return board;
    });
    vi.mocked(api.addCard).mockImplementation(async (id, title, details) => {
      board = boardActions.addCard(board, id, { title, details });
      return board;
    });
    vi.mocked(api.deleteCard).mockImplementation(async (id) => {
      board = boardActions.deleteCard(board, id);
      return board;
    });
  });

  it("renders board with data from the api", async () => {
    renderBoard();
    expect(
      screen.getByRole("heading", { name: "Kanban Board" })
    ).toBeInTheDocument();
    expect(await screen.findByText("Backlog")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("Research competitors")).toBeInTheDocument();
  });

  it("renames a column", async () => {
    const user = userEvent.setup();
    renderBoard();

    const renameButton = (
      await screen.findAllByRole("button", { name: "Rename column: Backlog" })
    )[0];
    await user.click(renameButton);

    const input = screen.getByLabelText("Column title");
    await user.clear(input);
    await user.type(input, "Ideas{Enter}");

    expect(await screen.findByText("Ideas")).toBeInTheDocument();
    expect(api.renameColumn).toHaveBeenCalledWith("col-backlog", "Ideas");
  });

  it("adds a card to a column", async () => {
    const user = userEvent.setup();
    renderBoard();

    const addButtons = await screen.findAllByRole("button", {
      name: "+ Add card",
    });
    await user.click(addButtons[0]);

    await user.type(screen.getByLabelText("Card title"), "New feature");
    await user.type(
      screen.getByLabelText("Card details"),
      "Implement something cool"
    );
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("New feature")).toBeInTheDocument();
    expect(screen.getByText("Implement something cool")).toBeInTheDocument();
  });

  it("deletes a card", async () => {
    const user = userEvent.setup();
    renderBoard();

    const card = (await screen.findAllByText("Research competitors"))[0].closest(
      ".group"
    )!;
    const deleteButton = within(card as HTMLElement).getByRole("button", {
      name: "Delete card: Research competitors",
    });
    await user.click(deleteButton);

    await waitFor(() =>
      expect(screen.queryByText("Research competitors")).not.toBeInTheDocument()
    );
    expect(api.deleteCard).toHaveBeenCalledWith("card-1");
  });
});
