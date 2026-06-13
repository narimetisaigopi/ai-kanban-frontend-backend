import json

import httpx
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..schemas import BoardOut, ChatMessage
from . import board as board_service

SYSTEM_PROMPT = (
    "You are an assistant inside a Kanban board app. You can manage the board "
    "by calling the provided tools. Use the current board state below to map "
    "column names and card titles to their ids. Columns and cards are "
    "identified by id. After making the requested changes, briefly confirm "
    "what you did. If the user only asks a question, answer it without calling "
    "tools. Keep answers concise.\n\nCurrent board:\n{board}"
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_card",
            "description": "Add a new card to a column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "column_id": {"type": "string"},
                    "title": {"type": "string"},
                    "details": {"type": "string"},
                },
                "required": ["column_id", "title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "rename_column",
            "description": "Rename a column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "column_id": {"type": "string"},
                    "title": {"type": "string"},
                },
                "required": ["column_id", "title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_card",
            "description": "Delete a card by its id.",
            "parameters": {
                "type": "object",
                "properties": {"card_id": {"type": "string"}},
                "required": ["card_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "move_card",
            "description": "Move a card to a column at a position (0 = top).",
            "parameters": {
                "type": "object",
                "properties": {
                    "card_id": {"type": "string"},
                    "to_column_id": {"type": "string"},
                    "to_index": {"type": "integer"},
                },
                "required": ["card_id", "to_column_id"],
            },
        },
    },
]

MAX_TOOL_ROUNDS = 5


def _board_summary(board: BoardOut) -> str:
    lines = []
    for col in board.columns:
        lines.append(f'- Column "{col.title}" (id={col.id})')
        for card_id in col.cardIds:
            card = board.cards[card_id]
            lines.append(f'    - "{card.title}" (id={card.id})')
    return "\n".join(lines)


async def _execute_tool(session: AsyncSession, name: str, args: dict) -> BoardOut:
    if name == "add_card":
        return await board_service.add_card(
            session, args["column_id"], args["title"], args.get("details", "")
        )
    if name == "rename_column":
        return await board_service.rename_column(
            session, args["column_id"], args["title"]
        )
    if name == "delete_card":
        return await board_service.delete_card(session, args["card_id"])
    if name == "move_card":
        return await board_service.move_card(
            session, args["card_id"], args["to_column_id"], args.get("to_index", 0)
        )
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown tool {name}"
    )


async def _call_model(client: httpx.AsyncClient, conversation: list[dict]) -> dict:
    payload = {
        "model": settings.openrouter_model,
        "messages": conversation,
        "tools": TOOLS,
    }
    headers = {"Authorization": f"Bearer {settings.openrouter_api_key}"}
    try:
        response = await client.post(
            settings.openrouter_url, json=payload, headers=headers
        )
        response.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Chat provider error",
        )
    return response.json()["choices"][0]["message"]


async def get_chat_reply(
    session: AsyncSession, messages: list[ChatMessage]
) -> tuple[str, BoardOut]:
    if not settings.openrouter_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Chat is not configured",
        )

    board = await board_service.get_board(session)
    conversation: list[dict] = [
        {
            "role": "system",
            "content": SYSTEM_PROMPT.format(board=_board_summary(board)),
        }
    ]
    conversation += [{"role": m.role, "content": m.content} for m in messages]

    async with httpx.AsyncClient(timeout=120) as client:
        for _ in range(MAX_TOOL_ROUNDS):
            message = await _call_model(client, conversation)
            tool_calls = message.get("tool_calls")

            if not tool_calls:
                reply = message.get("content") or message.get("reasoning")
                if not reply:
                    raise HTTPException(
                        status_code=status.HTTP_502_BAD_GATEWAY,
                        detail="Chat provider returned an empty response",
                    )
                board = await board_service.get_board(session)
                return reply, board

            conversation.append(
                {
                    "role": "assistant",
                    "content": message.get("content") or "",
                    "tool_calls": tool_calls,
                }
            )
            for call in tool_calls:
                fn = call["function"]
                try:
                    args = json.loads(fn.get("arguments") or "{}")
                    board = await _execute_tool(session, fn["name"], args)
                    result = "ok"
                except HTTPException as exc:
                    result = f"error: {exc.detail}"
                conversation.append(
                    {
                        "role": "tool",
                        "tool_call_id": call["id"],
                        "content": result,
                    }
                )

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="Chat could not complete the request",
    )
