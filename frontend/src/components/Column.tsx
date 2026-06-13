"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column as ColumnType, Card } from "@/lib/types";
import { RenameColumn } from "./RenameColumn";
import { KanbanCard } from "./KanbanCard";
import { AddCardForm } from "./AddCardForm";

type ColumnProps = {
  column: ColumnType;
  cards: Card[];
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (cardId: string) => void;
};

export function Column({
  column,
  cards,
  onRename,
  onAddCard,
  onDeleteCard,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      data-testid={`column-${column.id}`}
      className={`flex w-72 shrink-0 flex-col rounded-xl bg-gray-50/80 border border-gray-100 ${
        isOver ? "ring-2 ring-accent/60" : ""
      }`}
    >
      <div className="border-t-4 border-accent rounded-t-xl px-3 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <RenameColumn
            title={column.title}
            onRename={(title) => onRename(column.id, title)}
          />
          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {cards.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 pb-2 min-h-[120px]"
      >
        <SortableContext
          items={column.cardIds}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard key={card.id} card={card} onDelete={onDeleteCard} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <p className="py-4 text-center text-xs text-muted/60">
            Drop cards here
          </p>
        )}
      </div>

      <div className="px-3 pb-3">
        <AddCardForm
          onAdd={(title, details) => onAddCard(column.id, title, details)}
        />
      </div>
    </div>
  );
}
