from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth import require_user
from ..database import get_session
from ..schemas import ChatRequest, ChatResponse
from ..services.chat import get_chat_reply

router = APIRouter(prefix="/api", tags=["chat"], dependencies=[Depends(require_user)])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    session: AsyncSession = Depends(get_session),
) -> ChatResponse:
    reply, board = await get_chat_reply(session, payload.messages)
    return ChatResponse(reply=reply, board=board)
