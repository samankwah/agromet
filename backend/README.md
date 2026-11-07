# AgroMet Backend

The API for the AgroMet website and mobile app. It serves forecasts, flood and
drought risk, outlooks, advisories, calendars, market prices, crop diagnosis and
the AI assistant.

**Live:** https://agromet-backend.vercel.app/docs

Built with Python, FastAPI and Postgres (SQLite for local work).

## Features

| Feature | How it works | Code |
|---|---|---|
| Forecast | Open-Meteo, cached | `weather_runtime.py`, `precip_runtime.py` |
| Flood and drought index | 0 to 100 score per region from river flow (GloFAS), rain, soil moisture and 90-day SPI against 30 years of ERA5 | `hazards.py`, `hazard_math.py` |
| Weeks 2 to 4 outlook | NOAA GEFS ensemble, compared with ERA5 normals, refreshed daily | `s2s.py`, `s2s_runtime.py` |
| Seasonal outlook | ECMWF SEAS5: onset, cessation, dry spells and rainfall per region (AGRHYMET rules) | `agro_season.py`, `seasonal*.py` |
| AI assistant | OpenAI, given the farmer's own forecast, risk levels and prices before it answers; rate limited | `chat_context.py`, `chat_prompt.py` |
| Crop diagnosis | Kindwise for photos; OpenAI rewords the advice in plain language | `diagnosis.py`, `diagnosis_explain.py` |
| Advisories and calendars | Staff upload Excel files, preview, then publish | `spreadsheet_parser.py`, `routers/` |
| Market prices | Example figures from seed data | `routers/market.py` |

Publishing routes are limited to emails in `ADMIN_EMAILS`. The full route list
is at `/docs`.

## Run it

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Open http://localhost:8000/docs.

With no `DATABASE_URL` set, the backend uses a local SQLite file
(`agromet.db`).

## Environment variables

| Variable | Purpose |
|---|---|
| `SECRET_KEY` | Signs login tokens |
| `DATABASE_URL` | Postgres connection (unset uses SQLite) |
| `FRONTEND_ORIGINS` | Websites allowed to call the API |
| `ADMIN_EMAILS` | Accounts allowed to publish (empty means none) |
| `OPENAI_API_KEY` | AI assistant and diagnosis wording |
| `KINDWISE_API_KEY` | Crop diagnosis |
| `CRON_SECRET` | Protects the daily outlook refresh |
| `CONTACT_EMAIL` | Shown in Terms and Privacy |

The rest, with defaults, are in `.env.example` and `app/config.py`.

## Tests

```bash
python -m pytest
```

268 pass. No API keys or database are needed. 9 Postgres tests are skipped
unless `TEST_DATABASE_URL` is set.

## Deploy

```bash
npx vercel --prod
```

Run it from this folder. `vercel.json` also schedules two daily jobs that
refresh the weeks 2 to 4 outlook (05:00 UTC) and the seasonal outlook
(06:00 UTC).

## Folders

```
api/index.py     Vercel entry point
app/             The API (main.py builds it; routers/ holds the routes)
app/data/        Pre-computed ERA5 normals
scripts/         Scripts that build those normals
tests/           Tests
```
