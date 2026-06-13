"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "@/lib/types";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
};

export function KanbanCard({ card, onDelete }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50 shadow-lg ring-2 ring-accent" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-navy leading-snug">
          {card.title}
        </h3>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 rounded p-0.5 text-muted opacity-60 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
          aria-label={`Delete card: ${card.title}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.41 0 .75.337.75.75v.75h-1.5V4.75c0-.413.336-.75.75-.75zM8.75 7.5v7.5h-1.5v-7.5h1.5zm3 0v7.5h-1.5v-7.5h1.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
      {card.details && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {card.details}
        </p>
      )}
    </div>
  );
}
