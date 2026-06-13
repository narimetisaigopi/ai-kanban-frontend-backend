from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

import app.database as database
import app.main as main
from app.database import Base, get_session
from app.models import Column


async def test_get_session_yields_session(monkeypatch, sessionmaker_):
    monkeypatch.setattr(database, "SessionLocal", sessionmaker_)
    gen = get_session()
    session = await gen.__anext__()
    assert session is not None
    await gen.aclose()


async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


async def test_lifespan_creates_and_seeds(monkeypatch):
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    sessionmaker_ = async_sessionmaker(engine, expire_on_commit=False)
    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "SessionLocal", sessionmaker_)
    monkeypatch.setattr(main, "Base", Base)

    async with main.lifespan(main.app):
        async with sessionmaker_() as session:
            count = await session.scalar(select(func.count()).select_from(Column))
            assert count == 5
    await engine.dispose()
