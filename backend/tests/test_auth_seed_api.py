from sqlalchemy import func, select

from app.config import settings
from app.models import Card, Column
from app.seed import seed_if_empty


async def test_login_success(client):
    resp = await client.post(
        "/api/auth/login",
        json={"email": settings.demo_email, "password": settings.demo_password},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


async def test_login_failure(client):
    resp = await client.post(
        "/api/auth/login",
        json={"email": settings.demo_email, "password": "wrong"},
    )
    assert resp.status_code == 401


async def test_seed_populates(session):
    await seed_if_empty(session)
    columns = await session.scalar(select(func.count()).select_from(Column))
    cards = await session.scalar(select(func.count()).select_from(Card))
    assert columns == 5
    assert cards == 11


async def test_seed_is_idempotent(session):
    await seed_if_empty(session)
    await seed_if_empty(session)
    cards = await session.scalar(select(func.count()).select_from(Card))
    assert cards == 11
