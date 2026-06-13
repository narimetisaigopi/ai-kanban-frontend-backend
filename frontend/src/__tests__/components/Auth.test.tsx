import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "@/context/AuthContext";
import { LoginForm } from "@/components/LoginForm";
import { AuthGate } from "@/components/AuthGate";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, login: vi.fn(), getBoard: vi.fn() };
});

import * as api from "@/lib/api";

describe("LoginForm", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(api.login).mockReset();
  });

  it("logs in with valid credentials", async () => {
    const user = userEvent.setup();
    vi.mocked(api.login).mockImplementation(async () => {
      api.setToken("tok");
      return "tok";
    });

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() =>
      expect(api.login).toHaveBeenCalledWith("demo@kanban.app", "demo1234")
    );
  });

  it("shows an error on failed login", async () => {
    const user = userEvent.setup();
    vi.mocked(api.login).mockRejectedValue(new api.ApiError(401, "nope"));

    render(
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    );

    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText("Invalid email or password")
    ).toBeInTheDocument();
  });
});

describe("AuthGate", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(api.getBoard).mockResolvedValue({ columns: [], cards: {} });
  });

  it("shows the login form when no token is present", async () => {
    render(
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    );
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the board when a token is present", async () => {
    api.setToken("tok");
    render(
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    );
    expect(
      await screen.findByRole("heading", { name: "Kanban Board" })
    ).toBeInTheDocument();
  });
});
