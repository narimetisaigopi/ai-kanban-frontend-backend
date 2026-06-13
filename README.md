# Kanban Board

A single-board Kanban project management MVP. Next.js frontend, FastAPI backend,
Postgres storage, email/password login, and an AI assistant powered by OpenRouter.

## Run with Docker

```bash
cp .env.example .env   # add your OPENROUTER_API_KEY
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Demo login: `demo@kanban.app` / `demo1234`

The board is seeded with dummy data on first start and persisted in Postgres.

## Local development

Backend:

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload   # needs a running Postgres (see DATABASE_URL)
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Tests

Backend (100% coverage enforced):

```bash
docker run --rm -v "$PWD/backend:/app" kanban-backend pytest
```

Frontend:

```bash
cd frontend
npm test          # unit tests (vitest)
npm run test:e2e  # Playwright E2E (requires the stack running)
```

## API

- `POST /api/auth/login` - email/password login, returns a JWT
- `GET /api/board` - full board
- `PATCH /api/columns/{id}` - rename a column
- `POST /api/columns/{id}/cards` - add a card
- `DELETE /api/cards/{id}` - delete a card
- `POST /api/cards/{id}/move` - move a card
- `POST /api/chat` - chat with the assistant

All routes except login require a `Bearer` token.
