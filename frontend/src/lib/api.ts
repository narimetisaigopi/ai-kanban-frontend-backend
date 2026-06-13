import type { Board } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "kanban_token";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, `Request failed with status ${res.status}`);
  }

  return (await res.json()) as T;
}

export async function login(email: string, password: string): Promise<string> {
  const data = await request<{ access_token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data.access_token;
}

export function getBoard(): Promise<Board> {
  return request<Board>("/api/board");
}

export function renameColumn(columnId: string, title: string): Promise<Board> {
  return request<Board>(`/api/columns/${columnId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export function addCard(
  columnId: string,
  title: string,
  details: string
): Promise<Board> {
  return request<Board>(`/api/columns/${columnId}/cards`, {
    method: "POST",
    body: JSON.stringify({ title, details }),
  });
}

export function deleteCard(cardId: string): Promise<Board> {
  return request<Board>(`/api/cards/${cardId}`, { method: "DELETE" });
}

export function moveCard(
  cardId: string,
  toColumnId: string,
  toIndex: number
): Promise<Board> {
  return request<Board>(`/api/cards/${cardId}/move`, {
    method: "POST",
    body: JSON.stringify({ to_column_id: toColumnId, to_index: toIndex }),
  });
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

export function chat(
  messages: ChatMessage[]
): Promise<{ reply: string; board: Board | null }> {
  return request<{ reply: string; board: Board | null }>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
}
