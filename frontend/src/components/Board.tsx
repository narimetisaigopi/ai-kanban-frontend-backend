"use client";

import { useReducer, useCallback, useState, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import type { Board as BoardType } from "@/lib/types";
import { findColumnByCardId } from "@/lib/boardActions";
import * as api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Column } from "./Column";
import { ChatWidget } from "./ChatWidget";

const emptyBoard: BoardType = { columns: [], cards: {} };

function boardReducer(_state: BoardType, board: BoardType): BoardType {
  return board;
}

export function Board() {
  const { logout } = useAuth();
  const [board, setBoard] = useReducer(boardReducer, emptyBoard);
  const [loading, setLoading] = useState(true);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const dragOrigin = useRef<{ columnId: string; index: number } | null>(null);

  const run = useCallback(
    async (action: () => Promise<BoardType>) => {
      try {
        const next = await action();
        setBoard(next);
      } catch (err) {
        if (err instanceof api.ApiError && err.status === 401) {
          logout();
        }
      }
    },
    [logout]
  );

  useEffect(() => {
    run(api.getBoard).finally(() => setLoading(false));
  }, [run]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      const columnId = findColumnByCardId(board, id);
      const column = board.columns.find((c) => c.id === columnId);
      dragOrigin.current = columnId
        ? { columnId, index: column?.cardIds.indexOf(id) ?? 0 }
        : null;
      setActiveCardId(id);
    },
    [board]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const fromColumnId = findColumnByCardId(board, activeId);
      if (!fromColumnId) return;

      let toColumnId = overId;
      let toIndex: number;

      const overColumn = board.columns.find((c) => c.id === overId);
      if (overColumn) {
        toIndex = overColumn.cardIds.length;
      } else {
        toColumnId = findColumnByCardId(board, overId) ?? fromColumnId;
        const targetColumn = board.columns.find((c) => c.id === toColumnId);
        if (!targetColumn) return;
        toIndex = targetColumn.cardIds.indexOf(overId);
        if (toIndex === -1) toIndex = targetColumn.cardIds.length;
      }

      if (fromColumnId === toColumnId) {
        const column = board.columns.find((c) => c.id === fromColumnId);
        if (!column) return;
        const fromIndex = column.cardIds.indexOf(activeId);
        if (fromIndex === toIndex || fromIndex === -1) return;
        const newCardIds = arrayMove(column.cardIds, fromIndex, toIndex);
        setBoard({
          ...board,
          columns: board.columns.map((c) =>
            c.id === fromColumnId ? { ...c, cardIds: newCardIds } : c
          ),
        });
      } else {
        setBoard({
          ...board,
          columns: board.columns.map((col) => {
            if (col.id === fromColumnId) {
              return {
                ...col,
                cardIds: col.cardIds.filter((id) => id !== activeId),
              };
            }
            if (col.id === toColumnId) {
              const cardIds = [...col.cardIds];
              cardIds.splice(toIndex, 0, activeId);
              return { ...col, cardIds };
            }
            return col;
          }),
        });
      }
    },
    [board]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCardId(null);
      const activeId = event.active.id as string;
      const origin = dragOrigin.current;
      dragOrigin.current = null;

      const toColumnId = findColumnByCardId(board, activeId);
      if (!toColumnId) return;
      const column = board.columns.find((c) => c.id === toColumnId);
      const toIndex = column?.cardIds.indexOf(activeId) ?? 0;

      if (origin && origin.columnId === toColumnId && origin.index === toIndex) {
        return;
      }

      run(() => api.moveCard(activeId, toColumnId, toIndex));
    },
    [board, run]
  );

  const activeCard = activeCardId ? board.cards[activeCardId] : null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="shrink-0 border-b border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-accent" />
              <h1 className="text-2xl font-bold text-navy tracking-tight">
                Kanban Board
              </h1>
            </div>
            <p className="mt-1 ml-4 text-sm text-muted">
              Drag cards between columns to track progress
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-muted transition-colors hover:border-primary hover:text-primary"
          >
            Sign out
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted">Loading board...</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 gap-4 overflow-x-auto p-6">
            {board.columns.map((column) => {
              const cards = column.cardIds
                .map((id) => board.cards[id])
                .filter(Boolean);
              return (
                <Column
                  key={column.id}
                  column={column}
                  cards={cards}
                  onRename={(columnId, title) =>
                    run(() => api.renameColumn(columnId, title))
                  }
                  onAddCard={(columnId, title, details) =>
                    run(() => api.addCard(columnId, title, details))
                  }
                  onDeleteCard={(cardId) => run(() => api.deleteCard(cardId))}
                />
              );
            })}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="rotate-2 rounded-lg border border-accent bg-white p-3 shadow-xl ring-2 ring-accent/40 w-64">
                <h3 className="text-sm font-semibold text-navy">
                  {activeCard.title}
                </h3>
                {activeCard.details && (
                  <p className="mt-1 text-xs text-muted">{activeCard.details}</p>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <ChatWidget onBoardChange={setBoard} />
    </div>
  );
}
