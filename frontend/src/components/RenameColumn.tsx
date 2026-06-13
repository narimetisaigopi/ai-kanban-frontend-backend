"use client";

import { useState, useRef, useEffect } from "react";

type RenameColumnProps = {
  title: string;
  onRename: (title: string) => void;
};

export function RenameColumn({ title, onRename }: RenameColumnProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function commit() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) {
      onRename(trimmed);
    } else {
      setValue(title);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        className="w-full rounded border border-primary/30 bg-white px-2 py-1 text-sm font-semibold text-navy outline-none focus:border-primary"
        aria-label="Column title"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setValue(title);
        setEditing(true);
      }}
      className="w-full text-left text-sm font-semibold text-navy hover:text-primary transition-colors"
      aria-label={`Rename column: ${title}`}
    >
      {title}
    </button>
  );
}
