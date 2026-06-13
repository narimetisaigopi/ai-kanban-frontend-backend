from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import require_user
from ..database import get_session
from ..schemas import AddCardRequest, BoardOut, MoveCardRequest, RenameColumnRequest
from ..services import board as board_service

router = APIRouter(prefix="/api", tags=["board"], dependencies=[Depends(require_user)])


@router.get("/board", response_model=BoardOut)
async def get_board(session: AsyncSession = Depends(get_session)) -> BoardOut:
    return await board_service.get_board(session)


@router.patch("/columns/{column_id}", response_model=BoardOut)
async def rename_column(
    column_id: str,
    payload: RenameColumnRequest,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    return await board_service.rename_column(session, column_id, payload.title)


@router.post("/columns/{column_id}/cards", response_model=BoardOut)
async def add_card(
    column_id: str,
    payload: AddCardRequest,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    return await board_service.add_card(
        session, column_id, payload.title, payload.details
    )


@router.delete("/cards/{card_id}", response_model=BoardOut)
async def delete_card(
    card_id: str, session: AsyncSession = Depends(get_session)
) -> BoardOut:
    return await board_service.delete_card(session, card_id)


@router.post("/cards/{card_id}/move", response_model=BoardOut)
async def move_card(
    card_id: str,
    payload: MoveCardRequest,
    session: AsyncSession = Depends(get_session),
) -> BoardOut:
    return await board_service.move_card(
        session, card_id, payload.to_column_id, payload.to_index
    )
