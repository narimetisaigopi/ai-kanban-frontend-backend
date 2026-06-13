import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/context/AuthContext";
import { ChatWidget } from "@/components/ChatWidget";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, chat: vi.fn() };
});

import * as api from "@/lib/api";

function renderWidget(onBoardChange?: (board: import("@/lib/types").Board) => void) {
  return render(
    <AuthProvider>
      <ChatWidget onBoardChange={onBoardChange} />
    </AuthProvider>
  );
}

describe("ChatWidget", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(api.chat).mockReset();
  });

  it("opens and closes the panel", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole("button", { name: "Open assistant" }));
    expect(screen.getByRole("heading", { name: "Assistant" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close assistant" }));
    expect(
      screen.getByRole("button", { name: "Open assistant" })
    ).toBeInTheDocument();
  });

  it("sends a message and shows the reply", async () => {
    const user = userEvent.setup();
    vi.mocked(api.chat).mockResolvedValue({ reply: "Here is a plan", board: null });
    renderWidget();

    await user.click(screen.getByRole("button", { name: "Open assistant" }));
    await user.type(screen.getByLabelText("Chat message"), "Help me");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Help me")).toBeInTheDocument();
    expect(await screen.findByText("Here is a plan")).toBeInTheDocument();
  });

  it("updates the board when the assistant changes it", async () => {
    const user = userEvent.setup();
    const board = { columns: [], cards: {} };
    vi.mocked(api.chat).mockResolvedValue({ reply: "Done", board });
    const onBoardChange = vi.fn();
    renderWidget(onBoardChange);

    await user.click(screen.getByRole("button", { name: "Open assistant" }));
    await user.type(screen.getByLabelText("Chat message"), "Move a card");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await screen.findByText("Done");
    expect(onBoardChange).toHaveBeenCalledWith(board);
  });

  it("ignores empty input", async () => {
    const user = userEvent.setup();
    renderWidget();

    await user.click(screen.getByRole("button", { name: "Open assistant" }));
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(api.chat).not.toHaveBeenCalled();
  });

  it("shows an error message when the request fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.chat).mockRejectedValue(new Error("boom"));
    renderWidget();

    await user.click(screen.getByRole("button", { name: "Open assistant" }));
    await user.type(screen.getByLabelText("Chat message"), "Help me");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("Sorry, something went wrong.")
    ).toBeInTheDocument();
  });

  it("logs out when the request is unauthorized", async () => {
    const user = userEvent.setup();
    api.setToken("tok");
    vi.mocked(api.chat).mockRejectedValue(new api.ApiError(401, "nope"));
    renderWidget();

    await user.click(screen.getByRole("button", { name: "Open assistant" }));
    await user.type(screen.getByLabelText("Chat message"), "Help me");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await vi.waitFor(() => expect(api.getToken()).toBeNull());
  });
});
