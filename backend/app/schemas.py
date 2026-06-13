from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CardOut(BaseModel):
    id: str
    title: str
    details: str


class ColumnOut(BaseModel):
    id: str
    title: str
    cardIds: list[str]


class BoardOut(BaseModel):
    columns: list[ColumnOut]
    cards: dict[str, CardOut]


class RenameColumnRequest(BaseModel):
    title: str = Field(min_length=1)


class AddCardRequest(BaseModel):
    title: str = Field(min_length=1)
    details: str = ""


class MoveCardRequest(BaseModel):
    to_column_id: str
    to_index: int = Field(ge=0)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)


class ChatResponse(BaseModel):
    reply: str
    board: BoardOut | None = None
