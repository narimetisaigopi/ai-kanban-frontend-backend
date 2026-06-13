"use client";

import dynamic from "next/dynamic";

const Board = dynamic(
  () => import("./Board").then((mod) => mod.Board),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted">Loading board...</p>
      </div>
    ),
  }
);

export function BoardClient() {
  return <Board />;
}
