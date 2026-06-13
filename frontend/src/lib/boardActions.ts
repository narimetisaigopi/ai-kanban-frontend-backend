import type { Board } from "./types";

export function renameColumn(
  board: Board,
  columnId: string,
  title: string
): Board {
  return {
    ...board,
    columns: board.columns.map((col) =>
      col.id === columnId ? { ...col, title: title.trim() } : col
    ),
  };
}

export function addCard(
  board: Board,
  columnId: string,
  { title, details }: { title: string; details: string }
): Board {
  const trimmedTitle = title.trim();
  const trimmedDetails = details.trim();
  if (!trimmedTitle) return board;

  const id = crypto.randomUUID();
  const card = { id, title: trimmedTitle, details: trimmedDetails };

  return {
    ...board,
    cards: { ...board.cards, [id]: card },
    columns: board.columns.map((col) =>
      col.id === columnId ? { ...col, cardIds: [...col.cardIds, id] } : col
    ),
  };
}

export function deleteCard(board: Board, cardId: string): Board {
  const remainingCards = { ...board.cards };
  delete remainingCards[cardId];

  return {
    cards: remainingCards,
    columns: board.columns.map((col) => ({
      ...col,
      cardIds: col.cardIds.filter((id) => id !== cardId),
    })),
  };
}

export function moveCard(
  board: Board,
  {
    cardId,
    fromColumnId,
    toColumnId,
    toIndex,
  }: {
    cardId: string;
    fromColumnId: string;
    toColumnId: string;
    toIndex: number;
  }
): Board {
  return {
    ...board,
    columns: board.columns.map((col) => {
      if (col.id === fromColumnId && col.id === toColumnId) {
        const cardIds = [...col.cardIds];
        const fromIndex = cardIds.indexOf(cardId);
        if (fromIndex === -1) return col;
        cardIds.splice(fromIndex, 1);
        cardIds.splice(toIndex, 0, cardId);
        return { ...col, cardIds };
      }
      if (col.id === fromColumnId) {
        return { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) };
      }
      if (col.id === toColumnId) {
        const cardIds = [...col.cardIds];
        cardIds.splice(toIndex, 0, cardId);
        return { ...col, cardIds };
      }
      return col;
    }),
  };
}

export function findColumnByCardId(board: Board, cardId: string): string | null {
  const column = board.columns.find((col) => col.cardIds.includes(cardId));
  return column?.id ?? null;
}
