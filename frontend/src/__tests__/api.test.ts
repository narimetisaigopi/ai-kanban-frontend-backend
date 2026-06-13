import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as api from "@/lib/api";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

describe("api", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores and clears the token", () => {
    expect(api.getToken()).toBeNull();
    api.setToken("abc");
    expect(api.getToken()).toBe("abc");
    api.clearToken();
    expect(api.getToken()).toBeNull();
  });

  it("logs in and stores the token", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { access_token: "tok" }));
    const token = await api.login("demo@kanban.app", "demo1234");
    expect(token).toBe("tok");
    expect(api.getToken()).toBe("tok");
  });

  it("sends the auth header when a token is present", async () => {
    api.setToken("tok");
    const fetchMock = mockFetch(200, { columns: [], cards: {} });
    vi.stubGlobal("fetch", fetchMock);
    await api.getBoard();
    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe("Bearer tok");
  });

  it("clears the token and throws on 401", async () => {
    api.setToken("tok");
    vi.stubGlobal("fetch", mockFetch(401, {}));
    await expect(api.getBoard()).rejects.toBeInstanceOf(api.ApiError);
    expect(api.getToken()).toBeNull();
  });

  it("throws ApiError on other failures", async () => {
    vi.stubGlobal("fetch", mockFetch(500, {}));
    await expect(api.getBoard()).rejects.toMatchObject({ status: 500 });
  });

  it("calls the board endpoints", async () => {
    const fetchMock = mockFetch(200, { columns: [], cards: {} });
    vi.stubGlobal("fetch", fetchMock);

    await api.renameColumn("col-1", "New");
    await api.addCard("col-1", "Title", "Details");
    await api.deleteCard("card-1");
    await api.moveCard("card-1", "col-2", 0);
    await api.chat([{ role: "user", content: "hi" }]);

    const urls = fetchMock.mock.calls.map((c) => c[0]);
    expect(urls[0]).toContain("/api/columns/col-1");
    expect(urls[1]).toContain("/api/columns/col-1/cards");
    expect(urls[2]).toContain("/api/cards/card-1");
    expect(urls[3]).toContain("/api/cards/card-1/move");
    expect(urls[4]).toContain("/api/chat");
  });
});
