# AgroMet Ghana

Weather and farming advice for Ghanaian farmers: forecasts, flood and drought
warnings, seasonal outlooks, crop and poultry advisories, crop disease diagnosis,
market prices and an AI assistant.

| | |
|---|---|
| Website | https://agromet-ghana.vercel.app |
| API | https://agromet-backend.vercel.app/docs |
| Android app | [Download APK](https://github.com/samankwah/agromet-mobile/releases/download/v1.0.0/agromet-ghana-1.0.0.apk) |

## The project

The project is split across two repositories:

| Part | Where | Built with |
|---|---|---|
| Backend API | [`backend/`](backend) | Python, FastAPI, Postgres |
| Web dashboard | [`frontend/`](frontend) | React, Vite, Tailwind |
| Crop disease model | [`ml/`](ml) | TensorFlow, MobileNetV3 |
| Mobile app | [samankwah/agromet-mobile](https://github.com/samankwah/agromet-mobile) | React Native, Expo |

```
 Mobile app ─┐
             ├──>  Backend API  ──>  Open-Meteo (forecasts, ERA5, GEFS, SEAS5, GloFAS)
 Website  ───┘         │        ──>  OpenAI, Kindwise
                       └──>  Postgres
```

The mobile app runs the crop disease model on the phone, so diagnosis works
without internet.

## Main features

- **Forecasts:** current weather, hourly, 7 days, and a live rain map
- **Flood and drought index:** a 0 to 100 risk score for each of the 16 regions
- **Weeks 2 to 4 outlook:** chance of below, near or above normal rain and
  temperature (NOAA GEFS)
- **Seasonal outlook:** onset, cessation and dry spells per region (ECMWF SEAS5)
- **Advisories and calendars:** staff upload them on the web dashboard;
  farmers read them in the app
- **Crop diagnosis:** a cassava model on the phone (71.5% accuracy); Kindwise
  for other crops
- **AgroMet AI:** a chat assistant that answers from the farmer's own forecast,
  risk levels and prices
- **Market prices:** with WhatsApp ordering (prices are example figures)

## Run it locally

Backend (http://localhost:8000):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Website (http://localhost:3000):

```bash
cd frontend
npm install
npm run dev
```

Mobile app: see the [agromet-mobile README](https://github.com/samankwah/agromet-mobile#getting-started).

Each folder's README has the details and environment variables.

## Tests

| Part | Command | Result |
|---|---|---|
| Backend | `python -m pytest` | 268 passed |
| Website | `npm run build` | builds |
| Mobile | `npm test` | 1,185 passed |

## Deployment

The backend and the website are deployed to Vercel with `npx vercel --prod`,
run from their own folders. Pushing to GitHub does not deploy anything.

## License

MIT
