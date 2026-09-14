# AgroMet Monorepo

This repository now contains:

- `frontend/` - Vite React application
- `backend/` - FastAPI backend with SQLite, JWT auth, agricultural record storage, and chat/FAQ endpoints

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

## Backend setup

```powershell
cd backend
python -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

For the standard local dev flow, run the backend first in one terminal, then run the frontend in another:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

```powershell
cd frontend
npm run dev
```

## Root scripts

From the repo root:

```bash
npm run frontend:dev
npm run backend:dev
```

## Environment files

- Copy `frontend/.env.example` to `frontend/.env`
- Copy `backend/.env.example` to `backend/.env`

The frontend now expects a single backend base URL:

```env
VITE_BACKEND_BASE_URL=http://localhost:8000
```

If the crop calendar shows "server is offline" or "All API requests failed", verify that `frontend/.env` uses the same backend port that Uvicorn is running on, then restart the Vite dev server after changing any `VITE_*` environment value.

## Netlify deployment

This repo includes `netlify.toml` for deploying the Vite frontend from `frontend/`:

```text
Base directory: frontend
Build command: npm run build
Publish directory: dist
```

Set this environment variable in Netlify before deploying:

```env
VITE_BACKEND_BASE_URL=https://your-deployed-backend.example.com
```

Do not use `http://localhost:8000` on Netlify. A deployed frontend cannot reach a backend running on your local machine. After changing any `VITE_*` variable in Netlify, trigger a new deploy so Vite rebuilds the production bundle.
