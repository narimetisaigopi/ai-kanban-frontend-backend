import json

import httpx
import pytest
import respx
from fastapi import HTTPException

from app.config import settings
from app.schemas import ChatMessage
from app.services.chat import get_chat_reply


def text_response(text):
    return {"choices": [{"message": {"content": text}}]}


def tool_response(name, arguments):
    return {
        "choices": [
            {
                "message": {
                    "content": None,
                    "tool_calls": [
                        {
                            "id": "call_1",
                            "type": "function",
                            "function": {
                                "name": name,
                                "arguments": json.dumps(arguments),
                            },
                        }
                    ],
                }
            }
        ]
    }


async def test_chat_not_configured(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "")
    with pytest.raises(HTTPException) as exc:
        await get_chat_reply(seeded, [ChatMessage(role="user", content="hi")])
    assert exc.value.status_code == 503


@respx.mock
async def test_chat_success(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        side_effect=[httpx.Response(200, json=text_response("Hello there"))]
    )
    reply, board = await get_chat_reply(
        seeded, [ChatMessage(role="user", content="hi")]
    )
    assert reply == "Hello there"
    assert board.columns


@respx.mock
async def test_chat_falls_back_to_reasoning(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        side_effect=[
            httpx.Response(
                200,
                json={
                    "choices": [
                        {"message": {"content": None, "reasoning": "Let me think"}}
                    ]
                },
            )
        ]
    )
    reply, _ = await get_chat_reply(
        seeded, [ChatMessage(role="user", content="hi")]
    )
    assert reply == "Let me think"


@respx.mock
async def test_chat_empty_response(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        side_effect=[
            httpx.Response(200, json={"choices": [{"message": {"content": None}}]})
        ]
    )
    with pytest.raises(HTTPException) as exc:
        await get_chat_reply(seeded, [ChatMessage(role="user", content="hi")])
    assert exc.value.status_code == 502


@respx.mock
async def test_chat_provider_error(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        return_value=httpx.Response(500, json={"error": "boom"})
    )
    with pytest.raises(HTTPException) as exc:
        await get_chat_reply(seeded, [ChatMessage(role="user", content="hi")])
    assert exc.value.status_code == 502


@respx.mock
async def test_chat_executes_tool(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        side_effect=[
            httpx.Response(
                200,
                json=tool_response(
                    "move_card",
                    {"card_id": "card-1", "to_column_id": "col-done", "to_index": 0},
                ),
            ),
            httpx.Response(200, json=text_response("Moved it to Done")),
        ]
    )
    reply, board = await get_chat_reply(
        seeded, [ChatMessage(role="user", content="move card-1 to done")]
    )
    assert reply == "Moved it to Done"
    done = next(c for c in board.columns if c.id == "col-done")
    assert "card-1" in done.cardIds


@respx.mock
async def test_chat_adds_card(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        side_effect=[
            httpx.Response(
                200,
                json=tool_response(
                    "add_card",
                    {"column_id": "col-todo", "title": "From AI", "details": "x"},
                ),
            ),
            httpx.Response(200, json=text_response("Added the card")),
        ]
    )
    reply, board = await get_chat_reply(
        seeded, [ChatMessage(role="user", content="add a card to to do")]
    )
    assert reply == "Added the card"
    titles = [c.title for c in board.cards.values()]
    assert "From AI" in titles


@respx.mock
async def test_chat_tool_error_is_reported(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        side_effect=[
            httpx.Response(
                200, json=tool_response("delete_card", {"card_id": "missing"})
            ),
            httpx.Response(200, json=text_response("I couldn't find that card")),
        ]
    )
    reply, _ = await get_chat_reply(
        seeded, [ChatMessage(role="user", content="delete missing")]
    )
    assert reply == "I couldn't find that card"


@respx.mock
async def test_chat_unknown_tool_is_reported(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        side_effect=[
            httpx.Response(200, json=tool_response("frobnicate", {})),
            httpx.Response(200, json=text_response("I cannot do that")),
        ]
    )
    reply, _ = await get_chat_reply(
        seeded, [ChatMessage(role="user", content="frobnicate")]
    )
    assert reply == "I cannot do that"


@respx.mock
async def test_chat_stops_after_max_rounds(seeded, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        return_value=httpx.Response(
            200,
            json=tool_response(
                "rename_column", {"column_id": "col-todo", "title": "Renamed"}
            ),
        )
    )
    with pytest.raises(HTTPException) as exc:
        await get_chat_reply(seeded, [ChatMessage(role="user", content="loop")])
    assert exc.value.status_code == 502


async def test_chat_endpoint_requires_auth(client):
    resp = await client.post("/api/chat", json={"messages": []})
    assert resp.status_code == 401


@respx.mock
async def test_chat_endpoint_success(client, auth_headers, monkeypatch):
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key")
    respx.post(settings.openrouter_url).mock(
        side_effect=[httpx.Response(200, json=text_response("Plan your sprint"))]
    )
    resp = await client.post(
        "/api/chat",
        json={"messages": [{"role": "user", "content": "help"}]},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["reply"] == "Plan your sprint"
    assert body["board"]["columns"]
