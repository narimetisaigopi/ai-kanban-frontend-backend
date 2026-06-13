import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import Card, Column
from ..schemas import BoardOut, CardOut, ColumnOut


async def _load_columns(session: AsyncSession) -> list[Column]:
    result = await session.scalars(
        select(Column).options(selectinload(Column.cards)).order_by(Column.position)
    )
    return list(result)


async def get_board(session: AsyncSession) -> BoardOut:
    columns = await _load_columns(session)
    cards: dict[str, CardOut] = {}
    columns_out: list[ColumnOut] = []
    for column in columns:
        card_ids: list[str] = []
        for card in column.cards:
            cards[card.id] = CardOut(
                id=card.id, title=card.title, details=card.details
            )
            card_ids.append(card.id)
        columns_out.append(
            ColumnOut(id=column.id, title=column.title, cardIds=card_ids)
        )
    return BoardOut(columns=columns_out, cards=cards)


async def _get_column(session: AsyncSession, column_id: str) -> Column:
    column = await session.get(Column, column_id)
    if column is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Column not found"
        )
    return column


async def _get_card(session: AsyncSession, card_id: str) -> Card:
    card = await session.get(Card, card_id)
    if card is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
        )
    return card


async def rename_column(
    session: AsyncSession, column_id: str, title: str
) -> BoardOut:
    column = await _get_column(session, column_id)
    column.title = title.strip()
    await session.commit()
    return await get_board(session)


async def add_card(
    session: AsyncSession, column_id: str, title: str, details: str
) -> BoardOut:
    column = await _get_column(session, column_id)
    cards = await session.scalars(
        select(Card).where(Card.column_id == column_id)
    )
    next_position = len(list(cards))
    session.add(
        Card(
            id=str(uuid.uuid4()),
            column_id=column.id,
            title=title.strip(),
            details=details.strip(),
            position=next_position,
        )
    )
    await session.commit()
    return await get_board(session)


async def delete_card(session: AsyncSession, card_id: str) -> BoardOut:
    card = await _get_card(session, card_id)
    column_id = card.column_id
    await session.delete(card)
    await session.flush()
    await _reindex(session, column_id)
    await session.commit()
    return await get_board(session)


async def move_card(
    session: AsyncSession, card_id: str, to_column_id: str, to_index: int
) -> BoardOut:
    card = await _get_card(session, card_id)
    await _get_column(session, to_column_id)
    from_column_id = card.column_id

    card.column_id = to_column_id
    card.position = -1
    await session.flush()

    await _reindex(session, to_column_id, insert_card_id=card_id, insert_at=to_index)
    if from_column_id != to_column_id:
        await _reindex(session, from_column_id)

    await session.commit()
    return await get_board(session)


async def _reindex(
    session: AsyncSession,
    column_id: str,
    insert_card_id: str | None = None,
    insert_at: int | None = None,
) -> None:
    cards = list(
        await session.scalars(
            select(Card)
            .where(Card.column_id == column_id)
            .order_by(Card.position)
        )
    )
    if insert_card_id is not None:
        ordered = [c for c in cards if c.id != insert_card_id]
        moved = next(c for c in cards if c.id == insert_card_id)
        index = min(insert_at or 0, len(ordered))
        ordered.insert(index, moved)
    else:
        ordered = cards
    for position, card in enumerate(ordered):
        card.position = position
