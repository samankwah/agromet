# AgroMet Monorepo

This repository now contains:

- `frontend/` - Vite React application
- `backend/` - FastAPI backend with SQLite, JWT auth, agricultural record storage, and chat/FAQ endpoints

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

## Backend setup

```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
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

```bash
VITE_BACKEND_BASE_URL=http://localhost:8000
```
