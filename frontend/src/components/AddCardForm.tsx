"use client";

import { useState } from "react";

type AddCardFormProps = {
  onAdd: (title: string, details: string) => void;
};

export function AddCardForm({ onAdd }: AddCardFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, details);
    setTitle("");
    setDetails("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-muted/40 py-2 text-sm text-muted hover:border-primary hover:text-primary transition-colors"
      >
        + Add card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Card title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-navy outline-none focus:border-primary"
        autoFocus
        aria-label="Card title"
      />
      <textarea
        placeholder="Details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-muted outline-none focus:border-primary"
        aria-label="Card details"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle("");
            setDetails("");
          }}
          className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-navy transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
