"use client";

import { useAuth } from "@/context/AuthContext";
import { LoginForm } from "./LoginForm";
import { BoardClient } from "./BoardClient";

export function AuthGate() {
  const { token, ready } = useAuth();

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted">Loading...</p>
      </div>
    );
  }

  if (!token) {
    return <LoginForm />;
  }

  return <BoardClient />;
}
