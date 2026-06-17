# Kanban Board

A single-board Kanban project management MVP. Next.js frontend, FastAPI backend,
Postgres storage, email/password login, and an AI assistant powered by OpenRouter.


<img width="1134" height="830" alt="Screenshot 2026-06-17 at 8 47 45 AM" src="https://github.com/user-attachments/assets/ec217c0c-e4e9-4e54-81c6-c6713c6a67d9" />
<img width="333" height="250" alt="Screenshot 2026-06-17 at 8 47 39 AM" src="https://github.com/user-attachments/assets/643ff3ab-02ed-465e-a938-921582c8b55a" />
<img width="1137" height="831" alt="Screenshot 2026-06-17 at 8 47 22 AM" src="https://github.com/user-attachments/assets/df50a414-8288-4858-92e1-c0d60a2a7035" />
<img width="1133" height="831" alt="Screenshot 2026-06-17 at 8 46 25 AM" src="https://github.com/user-attachments/assets/4da5ddde-d1d8-4f08-87ad-ec4b3e9dea85" />
<img width="1138" height="834" alt="Screenshot 2026-06-17 at 8 46 19 AM" src="https://github.com/user-attachments/assets/6781b052-8a97-40b7-ad69-6a0a8dfce3a5" />


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

## Deploy backend and DB on Railway

1. Push this repo to GitHub.
2. In Railway, create a new project.
3. Add a `PostgreSQL` service.
4. Add a new service from GitHub and point the root directory to `backend`.
5. Keep Docker build enabled (the backend already has a `Dockerfile`).
6. Set backend environment variables in Railway:
	- `DATABASE_URL`: reference the Postgres service `DATABASE_URL`
	- `OPENROUTER_API_KEY`: your OpenRouter key
	- `CORS_ORIGINS`: your frontend URL (for example `https://your-app.vercel.app`)
	- `JWT_SECRET`: a strong random string
7. Deploy the backend service and verify `GET /api/health` returns `{"status":"ok"}`.

Notes:

- The backend now accepts Railway dynamic ports via `PORT`.
- Railway Postgres URLs are normalized automatically for async SQLAlchemy.
- If your frontend is on Vercel, set `NEXT_PUBLIC_API_URL` to the Railway backend URL.

## Deploy frontend on Vercel

Frontend is ready to deploy and automatically uses the Railway backend.

Using Vercel CLI:

```bash
npm install -g vercel
cd frontend
vercel deploy --prod --project-id prj_qgoEIslJuCTfdxu9bbx0dkdtMAFC
```

Or link via Vercel dashboard:
1. Go to https://vercel.com/dashboard
2. Import this GitHub repo
3. Set root directory to `frontend`
4. Vercel will detect Next.js and build automatically
5. Environment: the `NEXT_PUBLIC_API_URL` env var is set in `frontend/.env.production` pointing to Railway

The frontend is now live and connects to your Railway backend at `https://ai-kanban-frontend-backend-production.up.railway.app`.
